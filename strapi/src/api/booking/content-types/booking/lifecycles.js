/**
 * Booking lifecycle hooks.
 *
 * beforeCreate: pre-calculates total_price from the host's pricing_overrides
 * so the stored price is immutable after booking (issue #55).
 */

'use strict';

/**
 * Calculate total stay cost applying pricing overrides.
 * Server-side equivalent of src/utils/pricing.js calculateStayPrice().
 *
 * @param {object} host        - Strapi host entity (price_per_night, pricing_overrides[])
 * @param {string} checkIn     - 'YYYY-MM-DD'
 * @param {string} checkOut    - 'YYYY-MM-DD'
 * @returns {number} total price in AUD
 */
function calculateTotalPrice(host, checkIn, checkOut) {
  const overrides = host.pricing_overrides ?? [];
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  let total = 0;

  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const override = overrides.find(
      (o) => dateStr >= o.date_from && dateStr <= o.date_to
    );
    const rate = override
      ? override.price_per_night
      : (host.price_per_night ?? 0);
    total += rate;
  }

  return total;
}

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    // Skip if total_price already provided or host relation is missing
    if (data.total_price != null || !data.host) return;

    const hostId =
      typeof data.host === 'object' ? data.host.id ?? data.host : data.host;

    const host = await strapi.entityService.findOne('api::host.host', hostId, {
      populate: ['pricing_overrides'],
    });

    if (!host || !data.check_in || !data.check_out) return;

    data.total_price = calculateTotalPrice(host, data.check_in, data.check_out);
  },
};
