import { fmt, plural } from './svg.mjs';
import { formatDate, formatMonthYear } from './dates.mjs';

const cell = (value) => String(value).replaceAll('|', '\\|');

// The same numbers as the charts, as Markdown tables (README images cannot show tooltips).
export function renderStatsMarkdown(stats) {
  const { calendar, code } = stats;
  const lines = [
    '# Profile stats',
    '',
    `Generated ${formatDate(stats.generatedAt)} by the workflow in this repository. Totals only: no private code, project or client names.`,
    '',
    '## Overview',
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Contributions, last 12 months | ${fmt(calendar.lastYearTotal)} |`,
    `| Contributions, all-time (since ${formatMonthYear(calendar.since)}) | ${fmt(calendar.allTimeTotal)} |`,
    `| Repositories contributed to | ${code ? fmt(code.reposContributed) : 'n/a'} |`,
    `| Active days, last 12 months | ${fmt(calendar.activeDaysLastYear)} |`,
    `| Current streak | ${plural(calendar.currentStreak.days, 'day')} |`,
    `| Longest streak | ${plural(calendar.longestStreak.days, 'day')} |`,
    '',
    '## Contributions per month',
    '',
    '| Month | Contributions |',
    '| --- | ---: |',
    ...calendar.months.map((m) => `| ${formatMonthYear(m.month)} | ${fmt(m.count)} |`),
    '',
    '## Contributions by weekday, last 12 months',
    '',
    '| Day | Contributions |',
    '| --- | ---: |',
    ...calendar.weekdays.map((d) => `| ${d.day} | ${fmt(d.count)} |`),
    '',
    '## Languages',
    '',
  ];
  if (code?.languages?.length) {
    lines.push(
      `Share of code in repositories I have committed to, weighted by my share of commits. Excluded: ${code.excluded.join(', ')}.`,
      '',
      '| Language | Share |',
      '| --- | ---: |',
      ...code.languages.map((l) => `| ${cell(l.name)} | ${l.percent.toFixed(1)}% |`),
    );
  } else {
    lines.push('Not available yet.');
  }
  return `${lines.join('\n')}\n`;
}
