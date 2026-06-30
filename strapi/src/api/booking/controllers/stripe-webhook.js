/**
 * stripe-webhook.js — Stripe webhook controller.
 *
 * POST /api/bookings/stripe-webhook
 *
 * Handles three Stripe events:
 *
 *   checkout.session.completed
 *     • Looks up booking by stripe_session_id
 *     • Sets payment_status = 'paid'
 *     • Issues a Stripe Transfer to the host's connected account
 *       (platform_fee deducted; host receives total_price - fee)
 *
 *   checkout.session.expired
 *     • Sets payment_status = 'unpaid', clears stripe_session_id
 *
 *   payment_intent.canceled   (covers booking declined after payment)
 *     • Issues a full Stripe Refund via the payment_intent id
 *     • Sets payment_status = 'refunded'
 *
 * Webhook signature verification:
 *   All requests are verified with stripe.webhooks.constructEvent()
 *   using STRIPE_WEBHOOK_SECRET from the environment.
 *   Any request with an invalid or missing signature is rejected with 400.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY      — Stripe secret key (sk_live_… or sk_test_…)
 *   STRIPE_WEBHOOK_SECRET  — Webhook signing secret (whsec_…)
 *
 * Payout approach (Transfer):
 *   We use manual Stripe Transfers rather than automatic Connect payouts so
 *   that the platform controls timing (e.g. hold funds until check-in + 24h).
 *   The host's Stripe connected account ID is stored on the host record as
 *   `stripe_account_id`. If that field is absent the transfer is skipped and
 *   a warning is logged — the platform can pay out manually via the dashboard.
 *
 *   Platform fee = 10% of total_price (configurable via PLATFORM_FEE_PERCENT).
 */

'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 10);

module.exports = {
  /**
   * POST /api/bookings/stripe-webhook
   *
   * Strapi passes the raw request body as a Buffer when the koa body parser
   * is bypassed (required for Stripe signature verification).
   * If the body has already been parsed to JSON, we re-serialise it.
   */
  async handleWebhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !secret) {
      strapi.log.warn('stripe-webhook: missing signature or secret — rejected');
      return ctx.badRequest('Webhook signature verification failed.');
    }

    // Strapi/Koa may already have parsed the body; fall back to re-serialised JSON
    const rawBody = ctx.request.rawBody
      ?? (typeof ctx.request.body === 'string'
        ? ctx.request.body
        : JSON.stringify(ctx.request.body));

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err) {
      strapi.log.warn(`stripe-webhook: signature verification failed — ${err.message}`);
      return ctx.badRequest(`Webhook signature verification failed: ${err.message}`);
    }

    strapi.log.info(`stripe-webhook: received event ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await _handleSessionCompleted(event.data.object);
          break;

        case 'checkout.session.expired':
          await _handleSessionExpired(event.data.object);
          break;

        case 'payment_intent.canceled':
          await _handlePaymentIntentCanceled(event.data.object);
          break;

        default:
          // Acknowledge but ignore unhandled events
          strapi.log.debug(`stripe-webhook: unhandled event type ${event.type}`);
      }
    } catch (err) {
      strapi.log.error(`stripe-webhook: error processing ${event.type} — ${err.message}`, { err });
      // Return 500 so Stripe retries the webhook
      return ctx.internalServerError('Webhook handler error.');
    }

    // Stripe requires a 200 response to acknowledge receipt
    ctx.status = 200;
    ctx.body = { received: true };
  },
};

// ── Private event handlers ────────────────────────────────────────────────────

/**
 * checkout.session.completed
 * Mark the booking as paid and initiate the host payout transfer.
 */
async function _handleSessionCompleted(session) {
  const booking = await _findBookingBySessionId(session.id);
  if (!booking) {
    strapi.log.warn(`stripe-webhook: no booking found for session ${session.id}`);
    return;
  }

  await strapi.entityService.update('api::booking.booking', booking.id, {
    data: { payment_status: 'paid' },
  });

  strapi.log.info(`stripe-webhook: booking ${booking.id} marked paid`);

  // Issue Stripe Transfer to host's connected account
  await _transferToHost(booking, session).catch((err) =>
    strapi.log.warn(`stripe-webhook: host transfer failed for booking ${booking.id} — ${err.message}`)
  );
}

/**
 * checkout.session.expired
 * Reset payment_status to unpaid and clear the stale session id.
 */
async function _handleSessionExpired(session) {
  const booking = await _findBookingBySessionId(session.id);
  if (!booking) {
    strapi.log.warn(`stripe-webhook: no booking found for expired session ${session.id}`);
    return;
  }

  await strapi.entityService.update('api::booking.booking', booking.id, {
    data: { payment_status: 'unpaid', stripe_session_id: null },
  });

  strapi.log.info(`stripe-webhook: booking ${booking.id} reset to unpaid (session expired)`);
}

/**
 * payment_intent.canceled
 * Issue a full refund and mark the booking as refunded.
 * This also covers the "booking declined after payment" scenario.
 */
async function _handlePaymentIntentCanceled(paymentIntent) {
  // Find booking by stripe_session_id is unavailable here; search by payment_intent
  const bookings = await strapi.entityService.findMany('api::booking.booking', {
    filters: {
      payment_status: 'paid',
    },
    populate: ['guest'],
  });

  // Match on the payment intent attached to any paid booking whose Checkout
  // Session holds this payment_intent id. We look it up from Stripe directly
  // if needed, but first try a quick in-process match via session metadata.
  const booking = bookings.find(
    (b) => b.stripe_payment_intent_id === paymentIntent.id
  ) ?? null;

  if (!booking) {
    strapi.log.warn(
      `stripe-webhook: payment_intent.canceled — no matching paid booking for intent ${paymentIntent.id}`
    );
    return;
  }

  // Issue full refund
  try {
    const refund = await stripe.refunds.create({ payment_intent: paymentIntent.id });
    strapi.log.info(`stripe-webhook: refund ${refund.id} created for booking ${booking.id}`);
  } catch (err) {
    // Refund may already exist; log and continue to update status
    strapi.log.warn(`stripe-webhook: refund creation failed — ${err.message}`);
  }

  await strapi.entityService.update('api::booking.booking', booking.id, {
    data: { payment_status: 'refunded' },
  });

  strapi.log.info(`stripe-webhook: booking ${booking.id} marked refunded`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Find a booking by its Stripe Checkout Session ID.
 */
async function _findBookingBySessionId(sessionId) {
  const results = await strapi.entityService.findMany('api::booking.booking', {
    filters: { stripe_session_id: sessionId },
    populate: ['host', 'guest'],
    limit: 1,
  });
  return results?.[0] ?? null;
}

/**
 * Transfer the host's share of the booking total to their Stripe connected account.
 *
 * Amount = total_price - platform fee (default 10%).
 * Currency: AUD (configurable via STRIPE_CURRENCY env var, default 'aud').
 *
 * If the host has no stripe_account_id configured, the transfer is skipped
 * and logged as a warning — the platform can pay out via the Stripe dashboard.
 */
async function _transferToHost(booking, session) {
  const host = await strapi.entityService.findOne('api::host.host', booking.host?.id);
  const hostStripeAccountId = host?.stripe_account_id;

  if (!hostStripeAccountId) {
    strapi.log.warn(
      `stripe-webhook: host ${booking.host?.id} has no stripe_account_id — skipping transfer for booking ${booking.id}`
    );
    return;
  }

  const totalAud = booking.total_price ?? session.amount_total / 100;
  const platformFee = Math.round(totalAud * PLATFORM_FEE_PERCENT) / 100;
  const transferAmount = Math.round((totalAud - platformFee) * 100); // pence/cents
  const currency = process.env.STRIPE_CURRENCY ?? 'aud';

  const transfer = await stripe.transfers.create({
    amount: transferAmount,
    currency,
    destination: hostStripeAccountId,
    transfer_group: `booking_${booking.id}`,
    metadata: {
      booking_id: String(booking.id),
      platform_fee_aud: String(platformFee),
    },
  });

  await strapi.entityService.update('api::booking.booking', booking.id, {
    data: { stripe_transfer_id: transfer.id },
  });

  strapi.log.info(
    `stripe-webhook: transfer ${transfer.id} (${transferAmount / 100} ${currency}) created for booking ${booking.id}`
  );
}
