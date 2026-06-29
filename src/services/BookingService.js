import { STRAPI_URL } from '../config';

/**
 * Extract numeric Strapi ID from the store's prefixed id (e.g. 'api-3' → '3').
 * Falls back to a direct pass-through for raw numeric IDs.
 */
function toStrapiId(id) {
  if (typeof id === 'string' && id.startsWith('api-')) {
    return id.slice(4);
  }
  return id;
}

/**
 * GET /api/hosts/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * @param {string|number} hostId - store host id (e.g. 'api-1') or raw Strapi numeric id
 * @param {string} from          - 'YYYY-MM-DD'
 * @param {string} to            - 'YYYY-MM-DD'
 * @returns {Promise<{ available: string[], unavailable: string[] }>}
 */
export async function getAvailability(hostId, from, to) {
  const id = toStrapiId(hostId);
  const response = await fetch(
    `${STRAPI_URL}/api/hosts/${id}/availability?from=${from}&to=${to}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch availability: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * POST /api/bookings — create a booking request (requires auth token).
 *
 * @param {{ check_in: string, check_out: string, pet_ids: any[], message: string|null, host: string|number, total_price: number }} bookingData
 * @param {string} authToken
 * @returns {Promise<object>} created booking (Strapi v4 data envelope)
 */
export async function createBooking(bookingData, authToken) {
  const response = await fetch(`${STRAPI_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      data: {
        ...bookingData,
        host: toStrapiId(bookingData.host),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg =
      body?.error?.message ?? `Failed to create booking: HTTP ${response.status}`;
    throw new Error(msg);
  }

  const json = await response.json();
  return json?.data ?? null;
}

/**
 * PATCH /api/bookings/:id — host accept/decline (requires auth token).
 *
 * @param {string|number} bookingId
 * @param {'accepted'|'declined'} status
 * @param {string} authToken
 * @returns {Promise<object>} updated booking (Strapi v4 data envelope)
 */
export async function updateBookingStatus(bookingId, status, authToken) {
  const response = await fetch(`${STRAPI_URL}/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ data: { status } }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update booking status: HTTP ${response.status}`
    );
  }

  const json = await response.json();
  return json?.data ?? null;
}
