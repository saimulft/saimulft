import { cardRect, el, esc, fmt, plural, svgDoc, text } from '../svg.mjs';
import { formatMonthYear } from '../dates.mjs';

export function renderOverview(stats, theme) {
  const width = 840;
  const height = 132;
  const { calendar, code } = stats;
  const streak = calendar.currentStreak.days;
  const tiles = [
    { value: fmt(calendar.lastYearTotal), label: 'Contributions', sub: 'Last 12 months' },
    { value: fmt(calendar.allTimeTotal), label: 'All-time', sub: `Since ${formatMonthYear(calendar.since)}` },
    { value: code ? fmt(code.reposContributed) : 'n/a', label: 'Repositories', sub: 'Contributed to' },
    { value: fmt(calendar.activeDaysLastYear), label: 'Active days', sub: 'Last 12 months' },
    { value: fmt(streak), unit: streak === 1 ? 'day' : 'days', label: 'Current streak', sub: `Longest ${plural(calendar.longestStreak.days, 'day')}` },
  ];
  const tileWidth = width / tiles.length;
  const tilesMarkup = tiles.map((tile, i) => {
    const x = i * tileWidth + 28;
    const divider = i ? el('line', { x1: i * tileWidth, x2: i * tileWidth, y1: 30, y2: 102, stroke: theme.grid, 'stroke-width': 1 }) : '';
    const unit = tile.unit ? el('tspan', { dx: 6, 'font-size': 16, 'font-weight': 400, fill: theme.textSecondary }, esc(tile.unit)) : '';
    return (
      divider +
      el('text', { x, y: 64, fill: theme.text, 'font-size': 32, 'font-weight': 600 }, esc(tile.value), unit) +
      text(x, 88, tile.label, { size: 13, fill: theme.textSecondary }) +
      text(x, 108, tile.sub, { size: 12, fill: theme.textMuted })
    );
  });
  const desc = `${tiles.map((t) => `${t.label} (${t.sub.toLowerCase()}): ${t.value}${t.unit ? ` ${t.unit}` : ''}`).join('. ')}.`;
  return svgDoc({ width, height, title: 'GitHub activity overview', desc, body: cardRect(width, height, theme) + tilesMarkup.join('') });
}
