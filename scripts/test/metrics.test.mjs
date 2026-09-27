import test from 'node:test';
import assert from 'node:assert/strict';
import { activeDays, busiestDay, languageMix, monthlySeries, normalizeDays, roundToTotal, streaks, weekdayTotals } from '../lib/metrics.mjs';
import { formatDate, formatMonthYear, monthParts } from '../lib/dates.mjs';
import { consecutiveDays } from './helpers.mjs';

test('date helpers format UTC dates', () => {
  assert.equal(formatDate('2026-09-26T06:23:00Z'), 'Sep 26, 2026');
  assert.equal(formatMonthYear('2019-09-30'), 'Sep 2019');
  assert.deepEqual(monthParts('2026-01'), { year: 2026, month: 1, short: 'Jan', long: 'January' });
});

test('normalizeDays sorts by date and keeps the last value for duplicates', () => {
  assert.deepEqual(
    normalizeDays([{ date: '2026-01-02', count: 1 }, { date: '2026-01-01', count: 2 }, { date: '2026-01-02', count: 5 }]),
    [{ date: '2026-01-01', count: 2 }, { date: '2026-01-02', count: 5 }],
  );
});

test('current streak includes today when today has contributions', () => {
  const days = consecutiveDays('2026-09-20', [0, 0, 0, 0, 1, 2, 3]);
  assert.deepEqual(streaks(days, '2026-09-26').current, { days: 3, start: '2026-09-24', end: '2026-09-26' });
});

test('a quiet today does not break the current streak', () => {
  const days = consecutiveDays('2026-09-22', [0, 0, 1, 2, 0]);
  assert.deepEqual(streaks(days, '2026-09-26').current, { days: 2, start: '2026-09-24', end: '2026-09-25' });
});

test('quiet today and yesterday means no current streak', () => {
  const days = consecutiveDays('2026-09-22', [3, 3, 3, 0, 0]);
  assert.deepEqual(streaks(days, '2026-09-26').current, { days: 0, start: null, end: null });
});

test('longest streak spans year boundaries and resets on gaps in the data', () => {
  const days = [
    ...consecutiveDays('2025-12-29', [1, 1, 1, 1, 1, 0]),
    ...consecutiveDays('2026-01-10', [4, 4]),
    ...consecutiveDays('2026-01-13', [4]),
  ];
  assert.deepEqual(streaks(days, '2026-01-20').longest, { days: 5, start: '2025-12-29', end: '2026-01-02' });
});

test('monthlySeries returns 12 zero-filled months ending with the current month', () => {
  const series = monthlySeries(
    [{ date: '2025-10-05', count: 3 }, { date: '2025-10-06', count: 4 }, { date: '2026-09-26', count: 12 }, { date: '2024-01-01', count: 99 }],
    '2026-09-26',
  );
  assert.equal(series.length, 12);
  assert.deepEqual(series[0], { month: '2025-10', count: 7 });
  assert.deepEqual(series[3], { month: '2026-01', count: 0 });
  assert.deepEqual(series[11], { month: '2026-09', count: 12 });
});

test('weekdayTotals orders Monday first', () => {
  const totals = weekdayTotals([{ date: '2026-09-21', count: 5 }, { date: '2026-09-27', count: 2 }, { date: '2026-09-28', count: 1 }]);
  assert.deepEqual(totals.map((t) => t.day), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  assert.equal(totals[0].count, 6);
  assert.equal(totals[6].count, 2);
});

test('activeDays and busiestDay summarise the window', () => {
  const days = consecutiveDays('2026-03-27', [0, 5, 46, 46, 0]);
  assert.equal(activeDays(days), 3);
  assert.deepEqual(busiestDay(days), { date: '2026-03-29', count: 46 });
  assert.equal(busiestDay(consecutiveDays('2026-03-27', [0, 0])), null);
});

test('roundToTotal keeps one decimal and sums to exactly 100', () => {
  const rounded = roundToTotal([100 / 3, 100 / 3, 100 / 3]);
  assert.deepEqual(rounded, [33.4, 33.3, 33.3]);
  assert.equal(Math.round(rounded.reduce((a, b) => a + b, 0) * 10), 1000);
});

test('languageMix weights bytes by my share of commits, drops markup and folds the tail', () => {
  const mix = languageMix(
    [
      { mine: 10, total: 10, languages: { TypeScript: 600, HTML: 5000, CSS: 100 } },
      { mine: 5, total: 10, languages: { JavaScript: 400, PHP: 400 } },
      { mine: 0, total: 5, languages: { Ruby: 9999 } },
    ],
    { top: 2 },
  );
  assert.deepEqual(mix, [
    { name: 'TypeScript', percent: 60 },
    { name: 'JavaScript', percent: 20 },
    { name: 'Other', percent: 20 },
  ]);
  assert.deepEqual(languageMix([]), []);
});
