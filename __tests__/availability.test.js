/**
 * __tests__/availability.test.js
 *
 * Unit tests for the availability computation logic in
 * src/utils/availability.js, mirroring the server-side
 * GET /api/hosts/:id/availability controller behaviour.
 */

import { computeAvailability } from '../src/utils/availability';

describe('computeAvailability', () => {
  // ── Basic availability ──────────────────────────────────────────────────────

  it('returns all nights available when there are no bookings', () => {
    const result = computeAvailability([], '2024-12-01', '2024-12-04');

    expect(result.available).toEqual(['2024-12-01', '2024-12-02', '2024-12-03']);
    expect(result.unavailable).toEqual([]);
  });

  it('marks nights within an accepted booking as unavailable', () => {
    const bookings = [
      { check_in: '2024-12-02', check_out: '2024-12-04' }, // blocks 02, 03
    ];

    const result = computeAvailability(bookings, '2024-12-01', '2024-12-06');

    expect(result.unavailable).toEqual(['2024-12-02', '2024-12-03']);
    expect(result.available).toEqual(['2024-12-01', '2024-12-04', '2024-12-05']);
  });

  // ── check_in inclusive / check_out exclusive ────────────────────────────────

  it('treats check_in as inclusive (first night is unavailable)', () => {
    const bookings = [{ check_in: '2024-12-05', check_out: '2024-12-07' }];

    const result = computeAvailability(bookings, '2024-12-04', '2024-12-08');

    expect(result.unavailable).toContain('2024-12-05'); // inclusive
    expect(result.available).toContain('2024-12-04');
  });

  it('treats check_out as exclusive (check_out night is available)', () => {
    const bookings = [{ check_in: '2024-12-05', check_out: '2024-12-07' }];

    const result = computeAvailability(bookings, '2024-12-04', '2024-12-08');

    // check_out = 07, so last blocked night = 06; 07 itself is free
    expect(result.unavailable).toEqual(['2024-12-05', '2024-12-06']);
    expect(result.available).toContain('2024-12-07');
  });

  it('single-night booking blocks exactly one night', () => {
    const bookings = [{ check_in: '2024-12-10', check_out: '2024-12-11' }];

    const result = computeAvailability(bookings, '2024-12-09', '2024-12-13');

    expect(result.unavailable).toEqual(['2024-12-10']);
    expect(result.available).toEqual(['2024-12-09', '2024-12-11', '2024-12-12']);
  });

  // ── Nights outside range ────────────────────────────────────────────────────

  it('does not include nights outside the requested range', () => {
    const bookings = [
      { check_in: '2024-11-28', check_out: '2024-12-03' }, // partially outside range
    ];

    const result = computeAvailability(bookings, '2024-12-01', '2024-12-05');

    // Only 01, 02 from this booking fall inside the range
    expect(result.unavailable).toEqual(['2024-12-01', '2024-12-02']);
    expect(result.available).toEqual(['2024-12-03', '2024-12-04']);
  });

  it('booking entirely before range does not affect results', () => {
    const bookings = [{ check_in: '2024-11-01', check_out: '2024-11-10' }];

    const result = computeAvailability(bookings, '2024-12-01', '2024-12-04');

    expect(result.unavailable).toEqual([]);
    expect(result.available).toEqual(['2024-12-01', '2024-12-02', '2024-12-03']);
  });

  it('booking entirely after range does not affect results', () => {
    const bookings = [{ check_in: '2025-01-01', check_out: '2025-01-10' }];

    const result = computeAvailability(bookings, '2024-12-01', '2024-12-04');

    expect(result.unavailable).toEqual([]);
  });

  // ── Overlapping bookings ────────────────────────────────────────────────────

  it('overlapping bookings do not double-count nights', () => {
    const bookings = [
      { check_in: '2024-12-01', check_out: '2024-12-05' }, // 01–04
      { check_in: '2024-12-03', check_out: '2024-12-07' }, // 03–06 — overlaps
    ];

    const result = computeAvailability(bookings, '2024-12-01', '2024-12-08');

    // Each night 01–06 appears exactly once in unavailable
    expect(result.unavailable).toEqual([
      '2024-12-01',
      '2024-12-02',
      '2024-12-03',
      '2024-12-04',
      '2024-12-05',
      '2024-12-06',
    ]);
    expect(result.available).toEqual(['2024-12-07']);
  });

  it('multiple non-overlapping bookings each block their own nights', () => {
    const bookings = [
      { check_in: '2024-12-02', check_out: '2024-12-04' }, // 02–03
      { check_in: '2024-12-06', check_out: '2024-12-08' }, // 06–07
    ];

    const result = computeAvailability(bookings, '2024-12-01', '2024-12-10');

    expect(result.unavailable).toEqual([
      '2024-12-02',
      '2024-12-03',
      '2024-12-06',
      '2024-12-07',
    ]);
    expect(result.available).toEqual([
      '2024-12-01',
      '2024-12-04',
      '2024-12-05',
      '2024-12-08',
      '2024-12-09',
    ]);
  });

  // ── Edge: empty range ───────────────────────────────────────────────────────

  it('returns empty arrays when from equals to', () => {
    const result = computeAvailability([], '2024-12-01', '2024-12-01');

    expect(result.available).toEqual([]);
    expect(result.unavailable).toEqual([]);
  });
});
