import { STRAPI_URL } from '../config';

/**
 * Extract numeric Strapi ID from the store's prefixed id (e.g. 'api-3' → 3).
 * Falls back to a direct numeric parse for raw IDs.
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
 * @param {string|number} hostId - store host id (e.g. 'api-1') or raw Strapi id
 * @param {string} from          - 'YYYY-MM-DD'
 * @param {string} to            - 'YYYY-MM-DD'
 * @returns {{ available: string[], unavailable: string[] }}
 */
export async function getAvailability(hostId, from, to) {
  const id = toStrapiId(hostId);
  const url = `${STRAPI_URL}/api/hosts/${id}/availability?from=${from}&to=${to}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch availability: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * POST /api/bookings — create a booking request (requires auth token).
 *
 * @param {{ check_in: string, check_out: string, pet_ids: any[], message: string, host: string|number, total_price: number }} bookingData
 * @param {string} authToken
 * @returns {object} created booking data from Strapi
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
 * @returns {object} updated booking data from Strapi
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
    throw new Error(`Failed to update booking status: HTTP ${response.status}`);
  }

  const json = await response.json();
  return json?.data ?? null;
}


/**
 * GET /api/bookings/:id/messages — load messages for a booking thread.
 *
 * @param {string|number} bookingId
 * @param {string} authToken
 * @returns {Promise<Array<{ id, text, sender: { username }, createdAt }>>}
 */
export async function getMessages(bookingId, authToken) {
  const id = toStrapiId(bookingId);
  const res = await fetch(`${STRAPI_URL}/api/bookings/${id}/messages`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to load messages: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * POST /api/bookings/:id/messages — send a message on a booking thread.
 *
 * @param {string|number} bookingId
 * @param {string} text
 * @param {string} authToken
 * @returns {Promise<object>} created message
 */
export async function sendMessage(bookingId, text, authToken) {
  const id = toStrapiId(bookingId);
  const res = await fetch(`${STRAPI_URL}/api/bookings/${id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ data: { text } }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `Failed to send message: HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json();
}

/**
 * Submit a post-stay review for a completed booking.
 * @param {string} bookingId
 * @param {{ stars: number, text: string }} review
 * @param {string} authToken
 */
export async function submitReview(bookingId, { stars, text }, authToken) {
  const res = await fetch(`${STRAPI_URL}/api/bookings/${bookingId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ data: { stars, text } }),
  });
  return res.json();
}
