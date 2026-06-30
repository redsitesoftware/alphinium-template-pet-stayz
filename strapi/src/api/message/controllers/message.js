/**
 * message.js — Custom controller for booking thread messaging.
 *
 * GET  /api/bookings/:id/messages — list messages for a booking, oldest first
 * POST /api/bookings/:id/messages — send a message on a booking thread
 *
 * Both endpoints require authentication. Only the booking guest or the host
 * owner may read/send messages (non-participants receive 403).
 */

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::message.message', ({ strapi }) => ({
  /**
   * POST /api/bookings/:id/messages
   * Body: { data: { text: string } }  or  { text: string }
   */
  async send(ctx) {
    const bookingId = ctx.params.id;
    const { text } = ctx.request.body?.data ?? ctx.request.body ?? {};
    const userId = ctx.state.user?.id;

    if (!userId) return ctx.unauthorized('You must be logged in.');
    if (!text || typeof text !== 'string' || !text.trim()) {
      return ctx.badRequest('text is required.');
    }

    const authorized = await _isParticipant(strapi, bookingId, userId);
    if (authorized === null) return ctx.notFound('Booking not found.');
    if (!authorized) return ctx.forbidden('Only the booking guest or host owner can send messages.');

    const message = await strapi.entityService.create('api::message.message', {
      data: { text: text.trim(), booking: bookingId, sender: userId },
      populate: ['sender'],
    });

    return ctx.send(message);
  },

  /**
   * GET /api/bookings/:id/messages
   * Returns messages in chronological order (oldest first), sender populated.
   */
  async list(ctx) {
    const bookingId = ctx.params.id;
    const userId = ctx.state.user?.id;

    if (!userId) return ctx.unauthorized('You must be logged in.');

    const authorized = await _isParticipant(strapi, bookingId, userId);
    if (authorized === null) return ctx.notFound('Booking not found.');
    if (!authorized) return ctx.forbidden('Only the booking guest or host owner can view messages.');

    const messages = await strapi.entityService.findMany('api::message.message', {
      filters: { booking: { id: bookingId } },
      populate: ['sender'],
      sort: 'createdAt:asc',
    });

    return ctx.send(messages);
  },
}));

/**
 * Check whether `userId` is the booking guest or the host owner.
 *
 * @returns {boolean|null} true = participant, false = not participant, null = booking not found
 */
async function _isParticipant(strapi, bookingId, userId) {
  const booking = await strapi.entityService.findOne(
    'api::booking.booking',
    bookingId,
    { populate: ['guest', 'host'] }
  );

  if (!booking) return null;

  const isGuest = booking.guest?.id === userId;
  if (isGuest) return true;

  const hostEntity = await strapi.entityService.findOne(
    'api::host.host',
    booking.host?.id,
    { populate: ['owner'] }
  );

  const isHostOwner = hostEntity?.owner?.id === userId;
  return isHostOwner;
}
