import { describe, expect, it } from 'vitest';

import type { Tracker } from '@/lib/api/trackers/types';
import { getWeekDays, sumMinutesByDate, toDateKey } from '@/lib/tracker-days';

const NOW = new Date('2026-11-05T12:00:00.000Z');

function buildTracker(overrides: Partial<Tracker>): Tracker {
  return {
    id: 't',
    createdAt: '',
    updatedAt: '',
    date: '2026-11-05',
    description: null,
    durationMinutes: 0,
    isLive: false,
    liveDurationMinutes: 0,
    liveStatus: null,
    status: 'new',
    startLiveDate: null,
    projectId: 'p',
    userId: 'u',
    transactionId: null,
    ...overrides
  };
}

describe('sumMinutesByDate', () => {
  it('sums saved durations per day and counts a running timer by elapsed time', () => {
    const totals = sumMinutesByDate(
      [
        buildTracker({ durationMinutes: 60 }),
        buildTracker({ durationMinutes: 30 }),
        buildTracker({ date: '2026-11-04', durationMinutes: 45 }),
        buildTracker({ isLive: true, liveStatus: 'start', liveDurationMinutes: 10, startLiveDate: '2026-11-05T11:50:00.000Z' })
      ],
      NOW
    );

    expect(totals.get('2026-11-05')).toBe(60 + 30 + 20);
    expect(totals.get('2026-11-04')).toBe(45);
  });

  it('skips rejected entries', () => {
    const totals = sumMinutesByDate([buildTracker({ durationMinutes: 60, status: 'rejected' })], NOW);

    expect(totals.get('2026-11-05')).toBeUndefined();
  });
});

describe('getWeekDays', () => {
  it('returns Monday to Sunday around the date', () => {
    const days = getWeekDays(new Date(2026, 10, 5)).map(toDateKey);

    expect(days).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
  });
});
