/**
 * availability.js — Pure availability computation utility.
 *
 * Shared logic for the GET /api/hosts/:id/availability endpoint.
 * Accepts an array of bookings and a requested date range, returns
 * which nights are available vs unavailable.
 *
 * Rules:
 * - check_in is inclusive (that night counts as booked)
 * - check_out is exclusive (the last night is check_out minus 1 day)
 * - "Pending" and "accepted" bookings both block nights
 * - Overlapping bookings are deduplicated (a night is unavailable once)
 */

/**
 * Compute available and unavailable nights within [from, to).
 *
 * @param {Array<{ check_in: string, check_out: string }>} bookings
 *   Existing bookings (accepted or pending) for this host.
 *   check_in / check_out are 'YYYY-MM-DD' strings.
 * @param {string} from  Range start, inclusive. 'YYYY-MM-DD'
 * @param {string} to    Range end, exclusive.   'YYYY-MM-DD'
 * @returns {{ available: string[], unavailable: string[] }}
 */
export function computeAvailability(bookings, from, to) {
  const unavailableSet = new Set();

  for (const booking of bookings) {
    const start = new Date(booking.check_in);
    const end = new Date(booking.check_out); // exclusive

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Only mark nights within the requested window
      if (dateStr >= from && dateStr < to) {
        unavailableSet.add(dateStr);
      }
    }
  }

  const available = [];
  const unavailable = [];

  const rangeEnd = new Date(to);
  for (let d = new Date(from); d < rangeEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (unavailableSet.has(dateStr)) {
      unavailable.push(dateStr);
    } else {
      available.push(dateStr);
    }
  }

  return { available, unavailable };
}
