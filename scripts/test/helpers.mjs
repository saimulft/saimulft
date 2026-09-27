import assert from 'node:assert/strict';
import { addDays } from '../lib/dates.mjs';

const BAD_AMPERSAND = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/;
const TOKEN = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;

// Minimal XML well-formedness check: balanced tags, quoted attributes, escaped text.
export function assertWellFormedXml(xml) {
  const stack = [];
  let last = 0;
  for (const match of xml.matchAll(TOKEN)) {
    const between = xml.slice(last, match.index);
    assert.ok(!/[<>]/.test(between), `stray angle bracket near: ${between.slice(0, 60)}`);
    assert.ok(!BAD_AMPERSAND.test(between), `unescaped ampersand near: ${between.slice(0, 60)}`);
    last = match.index + match[0].length;
    const [, closing, name, attributes = '', selfClosing] = match;
    if (!name) continue;
    assert.ok(!BAD_AMPERSAND.test(attributes), `unescaped ampersand in <${name}>`);
    if (closing) assert.equal(stack.pop(), name, `mismatched </${name}>`);
    else if (!selfClosing) stack.push(name);
  }
  assert.ok(!/[<>]/.test(xml.slice(last)), 'stray angle bracket at the end');
  assert.deepEqual(stack, [], `unclosed tags: ${stack.join(', ')}`);
}

export function consecutiveDays(start, counts) {
  return counts.map((count, i) => ({ date: addDays(start, i), count }));
}

const MONTHS = [['2025-10', 43], ['2025-11', 76], ['2025-12', 18], ['2026-01', 32], ['2026-02', 53], ['2026-03', 306], ['2026-04', 136], ['2026-05', 158], ['2026-06', 102], ['2026-07', 46], ['2026-08', 211], ['2026-09', 261]];
const WEEKDAYS = [['Mon', 228], ['Tue', 172], ['Wed', 150], ['Thu', 218], ['Fri', 243], ['Sat', 238], ['Sun', 201]];

// Real numbers from 2026-09-26, used as a stable fixture.
export function sampleStats(overrides = {}) {
  return {
    schemaVersion: 1,
    generatedAt: '2026-09-26T06:23:00.000Z',
    login: 'saimulft',
    calendar: {
      since: '2019-09-30',
      lastYearTotal: 1450,
      allTimeTotal: 1513,
      activeDaysLastYear: 197,
      currentStreak: { days: 13, start: '2026-09-14', end: '2026-09-26' },
      longestStreak: { days: 14, start: '2026-03-20', end: '2026-04-02' },
      busiestDay: { date: '2026-03-29', count: 46 },
      months: MONTHS.map(([month, count]) => ({ month, count })),
      weekdays: WEEKDAYS.map(([day, count]) => ({ day, count })),
    },
    code: {
      updatedAt: '2026-09-26T06:23:00.000Z',
      reposContributed: 69,
      commits: 1415,
      languages: [
        { name: 'TypeScript', percent: 41.1 },
        { name: 'JavaScript', percent: 31.8 },
        { name: 'PHP', percent: 17.6 },
        { name: 'Blade', percent: 4.7 },
        { name: 'Twig', percent: 2.4 },
        { name: 'Other', percent: 2.4 },
      ],
      excluded: ['HTML', 'CSS', 'SCSS', 'Sass', 'Less'],
    },
    ...overrides,
  };
}
