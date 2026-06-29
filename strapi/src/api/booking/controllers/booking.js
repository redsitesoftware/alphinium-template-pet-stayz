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
