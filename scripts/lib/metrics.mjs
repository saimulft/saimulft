import { WEEKDAYS, addDays, parseISODate, toISODate } from './dates.mjs';

// Markup and stylesheet bytes come mostly from exported templates, so they are left out.
export const DEFAULT_EXCLUDED_LANGUAGES = ['HTML', 'CSS', 'SCSS', 'Sass', 'Less'];

export function normalizeDays(days) {
  const byDate = new Map();
  for (const day of days) byDate.set(day.date, day.count);
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, count]) => ({ date, count }));
}

export function streaks(days, today) {
  const counts = new Map(days.map((d) => [d.date, d.count]));
  const countOn = (date) => counts.get(date) ?? 0;

  // Today is not over yet, so a zero today does not end the streak.
  let current = { days: 0, start: null, end: null };
  const end = countOn(today) > 0 ? today : addDays(today, -1);
  if (countOn(end) > 0) {
    let start = end;
    while (countOn(addDays(start, -1)) > 0) start = addDays(start, -1);
    current = { days: Math.round((parseISODate(end) - parseISODate(start)) / 86400000) + 1, start, end };
  }

  let longest = { days: 0, start: null, end: null };
  let runStart = null;
  let runLength = 0;
  let previous = null;
  for (const { date, count } of normalizeDays(days)) {
    const contiguous = previous !== null && addDays(previous, 1) === date;
    if (count > 0) {
      if (runLength > 0 && contiguous) {
        runLength += 1;
      } else {
        runStart = date;
        runLength = 1;
      }
      if (runLength > longest.days) longest = { days: runLength, start: runStart, end: date };
    } else {
      runLength = 0;
    }
    previous = date;
  }
  return { current, longest };
}

export function monthlySeries(days, today, months = 12) {
  const totals = new Map();
  for (const { date, count } of days) totals.set(date.slice(0, 7), (totals.get(date.slice(0, 7)) ?? 0) + count);
  const [year, month] = today.split('-').map(Number);
  return Array.from({ length: months }, (_, i) => {
    const key = toISODate(new Date(Date.UTC(year, month - months + i, 1))).slice(0, 7);
    return { month: key, count: totals.get(key) ?? 0 };
  });
}

export function weekdayTotals(days) {
  const totals = WEEKDAYS.map((day) => ({ day, count: 0 }));
  for (const { date, count } of days) totals[(parseISODate(date).getUTCDay() + 6) % 7].count += count;
  return totals;
}

export function activeDays(days) {
  return days.filter((d) => d.count > 0).length;
}

export function busiestDay(days) {
  let best = null;
  for (const { date, count } of days) if (count > 0 && count > (best?.count ?? 0)) best = { date, count };
  return best;
}

// Largest-remainder rounding so the rounded values still add up to `total`.
export function roundToTotal(values, total = 100, decimals = 1) {
  const factor = 10 ** decimals;
  const scaled = values.map((v) => v * factor);
  const floors = scaled.map((v) => Math.floor(v));
  let missing = Math.round(total * factor) - floors.reduce((a, b) => a + b, 0);
  const order = scaled.map((v, i) => [v - floors[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (missing <= 0) break;
    floors[i] += 1;
    missing -= 1;
  }
  return floors.map((v) => v / factor);
}

export function languageMix(repos, { exclude = DEFAULT_EXCLUDED_LANGUAGES, top = 6 } = {}) {
  const skip = new Set(exclude);
  const weights = new Map();
  for (const { mine, total, languages } of repos) {
    if (!(mine > 0) || !(total > 0)) continue;
    const share = Math.min(1, mine / total);
    for (const [name, bytes] of Object.entries(languages ?? {})) {
      if (skip.has(name) || !(bytes > 0)) continue;
      weights.set(name, (weights.get(name) ?? 0) + bytes * share);
    }
  }
  const sum = [...weights.values()].reduce((a, b) => a + b, 0);
  if (sum === 0) return [];
  const ranked = [...weights.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const rest = ranked.slice(top).reduce((a, [, v]) => a + v, 0);
  const entries = rest > 0 ? [...ranked.slice(0, top), ['Other', rest]] : ranked.slice(0, top);
  const percents = roundToTotal(entries.map(([, v]) => (v / sum) * 100));
  return entries.map(([name], i) => ({ name, percent: percents[i] })).filter((entry) => entry.percent > 0);
}
