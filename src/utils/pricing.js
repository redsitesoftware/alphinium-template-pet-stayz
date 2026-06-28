/**
 * pricing.js — Stay cost calculation with date-range pricing overrides.
 *
 * Iterates each night of the stay. If a pricing override covers that night
 * (dateFrom <= night <= dateTo), the override rate applies; otherwise the
 * host's base pricePerNight is used.
 */

/**
 * Calculate total stay cost applying pricing overrides.
 * Falls back to host.pricePerNight for nights not covered by any override.
 *
 * @param {object} host       - host object from store (pricePerNight, pricingOverrides[])
 * @param {string} checkIn    - 'YYYY-MM-DD'
 * @param {string} checkOut   - 'YYYY-MM-DD'
 * @returns {{ total: number, nights: number, breakdown: Array<{date: string, rate: number, label: string}> }}
 */
export function calculateStayPrice(host, checkIn, checkOut) {
  const overrides = host.pricingOverrides ?? [];
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  const breakdown = [];
  let total = 0;
  let nights = 0;

  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const override = overrides.find(o => dateStr >= o.dateFrom && dateStr <= o.dateTo);
    const rate = override ? override.pricePerNight : (host.pricePerNight ?? 0);
    const label = override ? override.label : 'Standard';
    breakdown.push({ date: dateStr, rate, label });
    total += rate;
    nights++;
  }

  return { total, nights, breakdown };
}
