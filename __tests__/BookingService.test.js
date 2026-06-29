/**
 * __tests__/BookingService.test.js
 *
 * Unit tests for src/services/BookingService.js
 * Mocks global fetch — no live network calls.
 */

import {
  getAvailability,
  createBooking,
  updateBookingStatus,
} from '../src/services/BookingService';

const BASE = 'http://localhost:1337';

// ── fetch mock helpers ────────────────────────────────────────────────────────

function mockFetchOk(body) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status, body = {}) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

afterEach(() => {
  jest.resetAllMocks();
});

// ── getAvailability ───────────────────────────────────────────────────────────

describe('getAvailability', () => {
  it('calls the correct URL with from/to params (raw id)', async () => {
    mockFetchOk({ available: ['2024-12-01'], unavailable: [] });

    const result = await getAvailability(1, '2024-12-01', '2024-12-05');

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/hosts/1/availability?from=2024-12-01&to=2024-12-05`
    );
    expect(result).toEqual({ available: ['2024-12-01'], unavailable: [] });
  });

  it('strips api-N prefix from store host id', async () => {
    mockFetchOk({ available: [], unavailable: ['2024-12-02'] });

    await getAvailability('api-7', '2024-12-01', '2024-12-05');

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/hosts/7/availability?from=2024-12-01&to=2024-12-05`
    );
  });

  it('throws on non-OK HTTP response', async () => {
    mockFetchError(500);

    await expect(
      getAvailability(1, '2024-12-01', '2024-12-05')
    ).rejects.toThrow('Failed to fetch availability: HTTP 500');
  });
});

// ── createBooking ─────────────────────────────────────────────────────────────

describe('createBooking', () => {
  const bookingData = {
    check_in: '2024-12-10',
    check_out: '2024-12-15',
    pet_ids: ['pet-1'],
    message: 'Please note allergies',
    host: 'api-3',
    total_price: 275,
  };

  it('POSTs to /api/bookings with Authorization header', async () => {
    mockFetchOk({ data: { id: 42, attributes: { status: 'pending', total_price: 275 } } });

    await createBooking(bookingData, 'my-token');

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/bookings`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('sends correct Strapi v4 body envelope with numeric host id', async () => {
    mockFetchOk({ data: { id: 42 } });

    await createBooking(bookingData, 'tok');

    const call = global.fetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body).toEqual({
      data: {
        check_in: '2024-12-10',
        check_out: '2024-12-15',
        pet_ids: ['pet-1'],
        message: 'Please note allergies',
        host: '3', // api-3 stripped to '3'
        total_price: 275,
      },
    });
  });

  it('returns json.data from the response', async () => {
    const mockRecord = { id: 42, attributes: { status: 'pending' } };
    mockFetchOk({ data: mockRecord });

    const result = await createBooking(bookingData, 'tok');

    expect(result).toEqual(mockRecord);
  });

  it('throws with Strapi error.message on non-OK response', async () => {
    mockFetchError(400, { error: { message: 'Booking dates overlap' } });

    await expect(createBooking(bookingData, 'tok')).rejects.toThrow(
      'Booking dates overlap'
    );
  });

  it('falls back to generic message when Strapi error body is empty', async () => {
    mockFetchError(500, {});

    await expect(createBooking(bookingData, 'tok')).rejects.toThrow(
      'Failed to create booking: HTTP 500'
    );
  });
});

// ── updateBookingStatus ───────────────────────────────────────────────────────

describe('updateBookingStatus', () => {
  it('PATCHes the correct endpoint with Authorization header', async () => {
    mockFetchOk({ data: { id: 99, attributes: { status: 'accepted' } } });

    await updateBookingStatus(99, 'accepted', 'host-token');

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE}/api/bookings/99`,
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer host-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('sends status in Strapi v4 body envelope', async () => {
    mockFetchOk({ data: { id: 99 } });

    await updateBookingStatus(99, 'declined', 'tok');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ data: { status: 'declined' } });
  });

  it('returns json.data from the response', async () => {
    const mockRecord = { id: 99, attributes: { status: 'accepted' } };
    mockFetchOk({ data: mockRecord });

    const result = await updateBookingStatus(99, 'accepted', 'tok');

    expect(result).toEqual(mockRecord);
  });

  it('throws on non-OK HTTP response', async () => {
    mockFetchError(403);

    await expect(
      updateBookingStatus(99, 'accepted', 'tok')
    ).rejects.toThrow('Failed to update booking status: HTTP 403');
  });
});
