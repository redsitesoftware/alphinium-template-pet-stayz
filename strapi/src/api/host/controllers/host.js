/**
 * host.js — Custom controller for Host.
 *
 * availability: GET /api/hosts/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   Returns { available: ['YYYY-MM-DD', ...], unavailable: [...] }
 *   A night is unavailable if it falls inside any accepted or pending booking
 *   for this host (issue #55).
 */

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::host.host', ({ strapi }) => ({
  /**
   * GET /api/hosts/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async availability(ctx) {
    const { id } = ctx.params;
    const { from, to } = ctx.query;

    if (!from || !to) {
      return ctx.badRequest('Query params "from" and "to" are required (YYYY-MM-DD).');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate) || isNaN(toDate)) {
      return ctx.badRequest('"from" and "to" must be valid dates (YYYY-MM-DD).');
    }

    if (fromDate >= toDate) {
      return ctx.badRequest('"from" must be before "to".');
    }

    // Fetch all accepted/pending bookings for this host that overlap the range
    const bookings = await strapi.entityService.findMany('api::booking.booking', {
      filters: {
        host: { id },
        status: { $in: ['accepted', 'pending'] },
        // Overlap: booking.check_in < to AND booking.check_out > from
        check_in: { $lt: to },
        check_out: { $gt: from },
      },
      fields: ['check_in', 'check_out'],
    });

    // Build a set of unavailable date strings
    const unavailableSet = new Set();
    for (const booking of bookings) {
      const start = new Date(booking.check_in);
      const end = new Date(booking.check_out);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        // Only mark nights within our requested range
        if (dateStr >= from && dateStr < to) {
          unavailableSet.add(dateStr);
        }
      }
    }

    // Build available/unavailable arrays for every night in the range
    const available = [];
    const unavailable = [];

    for (let d = new Date(fromDate); d < toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (unavailableSet.has(dateStr)) {
        unavailable.push(dateStr);
      } else {
        available.push(dateStr);
      }
    }

    return ctx.send({ available, unavailable });
  },
}));
