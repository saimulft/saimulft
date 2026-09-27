import { cardRect, columnPath, el, fmt, text } from '../svg.mjs';

export function frame({ width, height, theme, title, subtitle, note }) {
  return (
    cardRect(width, height, theme) +
    text(28, 42, title, { size: 16, weight: 600, fill: theme.text }) +
    (subtitle ? text(28, 64, subtitle, { size: 13, fill: theme.textSecondary }) : '') +
    (note ? text(width - 28, 42, note, { size: 12, fill: theme.textMuted, anchor: 'end' }) : '')
  );
}

export function yAxis({ left, right, baseline, height, scale, theme }) {
  const ticks = scale.ticks.map((tick) => {
    const y = baseline - (tick / scale.max) * height;
    const line = tick === 0 ? '' : el('line', { x1: left, x2: right, y1: y, y2: y, stroke: theme.grid, 'stroke-width': 1 });
    return line + text(left - 12, y + 4, fmt(tick), { size: 12, fill: theme.textMuted, anchor: 'end', extra: { style: 'font-variant-numeric:tabular-nums' } });
  });
  return ticks.join('') + el('line', { x1: left, x2: right, y1: baseline, y2: baseline, stroke: theme.border, 'stroke-width': 1 });
}

export function peakIndex(values) {
  const max = Math.max(0, ...values);
  return max > 0 ? values.indexOf(max) : -1;
}

// Column geometry shared by the monthly and weekday charts: one series, one highlight.
export function columns({ values, left, right, baseline, height, scale, theme, highlightIndex, barWidth = 24 }) {
  const slot = (right - left) / values.length;
  const width = Math.min(barWidth, slot * 0.6);
  return values.map((value, i) => {
    const h = (value / scale.max) * height;
    const x = left + slot * i + (slot - width) / 2;
    const fill = i === highlightIndex ? theme.highlight : theme.series;
    const mark = h > 0 ? el('path', { d: columnPath(x, baseline, width, h), fill, class: 'gy', style: `animation-delay:${i * 40}ms` }) : '';
    return { i, value, top: baseline - h, center: x + width / 2, mark };
  });
}
