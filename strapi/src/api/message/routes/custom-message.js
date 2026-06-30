/**
 * custom-message.js — Routes for booking thread messaging.
 *
 * Mounted under /api/ by Strapi's router.
 * Both routes require authentication (no anonymous access to messages).
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/bookings/:id/messages',
      handler: 'message.list',
      config: { auth: { scope: ['find'] } },
    },
    {
      method: 'POST',
      path: '/bookings/:id/messages',
      handler: 'message.send',
      config: { auth: { scope: ['find'] } },
    },
  ],
};
