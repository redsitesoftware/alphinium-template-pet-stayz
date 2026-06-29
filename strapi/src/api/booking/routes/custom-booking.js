/**
 * custom-booking.js — Custom routes for the Booking content type.
 *
 * Adds PATCH /api/bookings/:id for host accept/decline (issue #55).
 * The default CRUD routes are provided by Strapi's core router.
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'PATCH',
      path: '/bookings/:id',
      handler: 'booking.updateStatus',
      config: {
        middlewares: [],
        policies: [],
        // Requires authenticated user — enforced inside the controller
        auth: {
          scope: ['find'],
        },
      },
    },
  ],
};
