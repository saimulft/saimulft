import { GROW_STYLE, fmt, niceScale, svgDoc, text } from '../svg.mjs';
import { WEEKDAYS_LONG } from '../dates.mjs';
import { columns, frame, peakIndex, yAxis } from './common.mjs';

export function renderRhythm(stats, theme) {
  const width = 410;
  const height = 320;
  const left = 64;
  const right = 382;
  const baseline = 252;
  const plotHeight = 152;
  const days = stats.calendar.weekdays;
  const values = days.map((d) => d.count);
  const scale = niceScale(Math.max(0, ...values), 3);
  const peak = peakIndex(values);

  let body = frame({ width, height, theme, title: 'Weekly rhythm', subtitle: 'Contributions by weekday, last 12 months' });
  body += yAxis({ left, right, baseline, height: plotHeight, scale, theme });
  for (const bar of columns({ values, left, right, baseline, height: plotHeight, scale, theme, highlightIndex: peak })) {
    body += bar.mark;
    if (bar.i === peak) body += text(bar.center, bar.top - 10, fmt(bar.value), { size: 13, weight: 600, fill: theme.text, anchor: 'middle' });
    body += text(bar.center, baseline + 24, days[bar.i].day, { size: 13, fill: theme.textMuted, anchor: 'middle' });
  }
  if (peak >= 0) body += text(28, height - 18, `Busiest day: ${WEEKDAYS_LONG[peak]}`, { size: 12, fill: theme.textMuted });
  const desc = `Contributions by weekday over the last 12 months: ${days.map((d) => `${d.day} ${d.count}`).join(', ')}.`;
  return svgDoc({ width, height, title: 'Weekly rhythm', desc, body, style: GROW_STYLE });
}
