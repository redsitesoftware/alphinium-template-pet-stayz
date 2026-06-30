/**
 * booking.js — Custom controller for Booking.
 *
 * updateStatus: PATCH /api/bookings/:id
 *   Auth-guarded: only the host owner of the booking may change status.
 *   Accepts { status: 'accepted' | 'declined' }.
 *   Optionally sends Strapi email notification to the guest (issue #55).
 */

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::booking.booking', ({ strapi }) => ({
  /**
   * PATCH /api/bookings/:id
   * Body: { data: { status: 'accepted' | 'declined' } }
   */
  async updateStatus(ctx) {
    const { id } = ctx.params;
    const { status } = ctx.request.body?.data ?? ctx.request.body ?? {};

    if (!['accepted', 'declined'].includes(status)) {
      return ctx.badRequest(
        'Invalid status. Must be "accepted" or "declined".'
      );
    }

    // Load booking with host relation to verify ownership
    const booking = await strapi.entityService.findOne(
      'api::booking.booking',
      id,
      { populate: ['host', 'guest'] }
    );

    if (!booking) {
      return ctx.notFound('Booking not found.');
    }

    // Verify the authenticated user owns the host listing
    const userId = ctx.state.user?.id;
    if (!userId) {
      return ctx.unauthorized('You must be logged in.');
    }

    const host = await strapi.entityService.findOne(
      'api::host.host',
      booking.host?.id,
      { populate: ['owner'] }
    );

    // Allow if host has an owner relation pointing to this user,
    // or fall back to checking the booking's createdBy (admin scenario)
    const hostOwnerId = host?.owner?.id ?? host?.createdBy?.id;
    if (hostOwnerId && hostOwnerId !== userId) {
      return ctx.forbidden('Only the host owner can update booking status.');
    }

    const updated = await strapi.entityService.update(
      'api::booking.booking',
      id,
      { data: { status } }
    );

    // Optional: send email notification to guest
    await _notifyGuest(strapi, booking, status).catch((err) =>
      strapi.log.warn('Booking email notification failed', { err })
    );

    return this.transformResponse(updated);
  },

  /**
   * POST /api/bookings/:id/review
   * Body: { data: { stars: 1–5, text: string } }
   * Guest can submit a review after check-out. Recalculates host rating.
   */
  async submitReview(ctx) {
    const { id } = ctx.params;
    const { stars, text } = ctx.request.body?.data ?? ctx.request.body ?? {};

    const userId = ctx.state.user?.id;
    if (!userId) return ctx.unauthorized('You must be logged in.');

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return ctx.badRequest('stars must be an integer between 1 and 5.');
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return ctx.badRequest('text is required.');
    }

    const booking = await strapi.entityService.findOne(
      'api::booking.booking', id, { populate: ['guest', 'host'] }
    );
    if (!booking) return ctx.notFound('Booking not found.');
    if (booking.guest?.id !== userId) return ctx.forbidden('Only the booking guest can submit a review.');

    const checkOut = booking.check_out ? new Date(booking.check_out) : null;
    if (!checkOut || checkOut > new Date()) {
      return ctx.badRequest('Stay has not yet completed.');
    }
    if (booking.guest_review_submitted) {
      return ctx.badRequest('A review has already been submitted for this booking.');
    }

    const guest = ctx.state.user;
    const newReview = { name: guest.username || guest.email, stars, text, booking_id: id };

    const host = await strapi.entityService.findOne(
      'api::host.host', booking.host?.id, { populate: ['reviews'] }
    );
    const allReviews = [...(host?.reviews || []), newReview];
    const avgRating = allReviews.reduce((s, r) => s + r.stars, 0) / allReviews.length;

    await strapi.entityService.update('api::host.host', booking.host.id, {
      data: { reviews: allReviews, rating: Math.round(avgRating * 10) / 10, review_count: allReviews.length },
    });
    await strapi.entityService.update('api::booking.booking', id, {
      data: { guest_review_submitted: true },
    });

    return ctx.send({ success: true });
  },

  /**
   * POST /api/bookings/:id/pay
   * Creates a Stripe Checkout session for the guest.
   * Returns { checkoutUrl }.
   */
  async pay(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.id;
    if (!userId) return ctx.unauthorized('You must be logged in.');

    const booking = await strapi.entityService.findOne(
      'api::booking.booking', id, { populate: ['guest', 'host'] }
    );
    if (!booking) return ctx.notFound('Booking not found.');
    if (booking.guest?.id !== userId) return ctx.forbidden('Only the booking guest can pay.');
    if (booking.status !== 'accepted') return ctx.badRequest('Booking must be accepted before payment.');
    if (booking.payment_status !== 'unpaid') return ctx.badRequest('Booking has already been paid or payment is pending.');

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return ctx.internalServerError('Stripe is not configured.');

    const Stripe = require('stripe');
    const stripe = Stripe(stripeKey);

    const amountCents = Math.round((booking.total_price || 0) * 100);
    const platformFee = Math.round(amountCents * 0.15);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: { name: `PetStayz Booking #${id}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: { destination: booking.host?.stripe_account_id || '' },
      },
      success_url: `alphinium://payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `alphinium://payment-cancel`,
    });

    await strapi.entityService.update('api::booking.booking', id, {
      data: { stripe_session_id: session.id, stripe_checkout_url: session.url, payment_status: 'pending' },
    });

    return ctx.send({ checkoutUrl: session.url });
  },
}));

/**
 * Send a status-change email to the guest via Strapi's built-in email plugin.
 * Silently skipped if the email plugin is not configured.
 */
async function _notifyGuest(strapi, booking, status) {
  const guestEmail = booking.guest?.email;
  if (!guestEmail) return;

  const subject =
    status === 'accepted'
      ? 'Your PetStayz booking has been accepted!'
      : 'Update on your PetStayz booking request';

  const text =
    status === 'accepted'
      ? `Great news! Your booking request (check-in: ${booking.check_in}, check-out: ${booking.check_out}) has been accepted by the host.`
      : `Unfortunately your booking request (check-in: ${booking.check_in}, check-out: ${booking.check_out}) was not accepted. Please try another host.`;

  await strapi.plugins['email'].services.email.send({
    to: guestEmail,
    subject,
    text,
  });
}
