import { GROW_STYLE, fmt, niceScale, svgDoc, text } from '../svg.mjs';
import { formatDate, monthParts } from '../dates.mjs';
import { columns, frame, peakIndex, yAxis } from './common.mjs';

export function renderActivity(stats, theme) {
  const width = 840;
  const height = 320;
  const left = 72;
  const right = 812;
  const baseline = 252;
  const plotHeight = 152;
  const months = stats.calendar.months;
  const values = months.map((m) => m.count);
  const scale = niceScale(Math.max(0, ...values));
  const peak = peakIndex(values);
  const first = monthParts(months[0].month);
  const last = monthParts(months.at(-1).month);
  const range = `${first.long} ${first.year} to ${last.long} ${last.year}`;
  const subtitle = peak >= 0 ? `${range} · peak in ${monthParts(months[peak].month).long}` : range;

  let body = frame({ width, height, theme, title: 'Contributions per month', subtitle, note: `Updated ${formatDate(stats.generatedAt)}` });
  body += yAxis({ left, right, baseline, height: plotHeight, scale, theme });
  for (const bar of columns({ values, left, right, baseline, height: plotHeight, scale, theme, highlightIndex: peak })) {
    const parts = monthParts(months[bar.i].month);
    const isLast = bar.i === months.length - 1;
    body += bar.mark;
    if ((bar.i === peak || isLast) && bar.value > 0) {
      body += text(bar.center, bar.top - 10, fmt(bar.value), { size: 13, weight: 600, fill: bar.i === peak ? theme.text : theme.textSecondary, anchor: 'middle' });
    }
    body += text(bar.center, baseline + 24, parts.short, { size: 13, fill: theme.textMuted, anchor: 'middle' });
    const year = bar.i === 0 || parts.month === 1 ? String(parts.year) : '';
    const sub = isLast ? [year, 'to date'].filter(Boolean).join(' ') : year;
    if (sub) body += text(bar.center, baseline + 44, sub, { size: 12, fill: theme.textMuted, anchor: 'middle' });
  }
  const desc = `Contributions per month, ${range}: ${months.map((m) => `${monthParts(m.month).short} ${monthParts(m.month).year} ${m.count}`).join(', ')}.`;
  return svgDoc({ width, height, title: 'Contributions per month', desc, body, style: GROW_STYLE });
}
