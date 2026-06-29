/**
 * custom-host.js — Custom routes for the Host content type.
 *
 * Adds GET /api/hosts/:id/availability for date-range availability checks (issue #55).
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/hosts/:id/availability',
      handler: 'host.availability',
      config: {
        middlewares: [],
        policies: [],
        auth: false, // Public endpoint — guests can check availability without logging in
      },
    },
  ],
};
