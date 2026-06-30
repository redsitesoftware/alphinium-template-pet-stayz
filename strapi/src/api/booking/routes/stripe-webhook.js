/**
 * stripe-webhook.js — Stripe webhook route registration.
 *
 * POST /api/bookings/stripe-webhook
 *   Unauthenticated — request authenticity is verified via Stripe signature.
 *   Must be listed BEFORE the core booking routes so Strapi's router matches
 *   /stripe-webhook before it tries to match /:id.
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/bookings/stripe-webhook',
      handler: 'stripe-webhook.handleWebhook',
      config: {
        auth: false, // Stripe signs the payload — no JWT auth
        middlewares: [],
        policies: [],
      },
    },
  ],
};
