import { GROW_STYLE, el, rowPath, svgDoc, text, truncate } from '../svg.mjs';
import { frame } from './common.mjs';

export function renderLanguages(stats, theme) {
  const width = 410;
  const height = 320;
  const labelX = 28;
  const barX = 128;
  const maxLength = width - barX - 76;
  const languages = stats.code?.languages ?? [];
  let body = frame({ width, height, theme, title: 'Languages', subtitle: "Share of code I've committed" });
  if (languages.length === 0) {
    body += text(width / 2, 190, 'Language data is not available yet', { size: 13, fill: theme.textMuted, anchor: 'middle' });
    return svgDoc({ width, height, title: 'Languages', desc: 'Language data is not available yet.', body });
  }
  const top = Math.max(...languages.map((l) => l.percent));
  const highlight = languages.findIndex((l) => l.name !== 'Other');
  languages.forEach((language, i) => {
    const y = 104 + i * 28;
    const length = Math.max(4, (language.percent / top) * maxLength);
    const fill = language.name === 'Other' ? theme.other : i === highlight ? theme.highlight : theme.series;
    body += text(labelX, y + 4.5, truncate(language.name, barX - labelX - 10, 13), { size: 13, fill: theme.text });
    body += el('path', { d: rowPath(barX, y, length, 14), fill, class: 'gx', style: `animation-delay:${i * 50}ms` });
    body += text(barX + length + 10, y + 4.5, `${language.percent.toFixed(1)}%`, { size: 13, fill: theme.textSecondary, extra: { style: 'font-variant-numeric:tabular-nums' } });
  });
  body += text(labelX, height - 18, 'HTML and CSS excluded · weighted by my commits', { size: 12, fill: theme.textMuted });
  const desc = `Share of code in repositories I have committed to, weighted by my share of commits, HTML and CSS excluded: ${languages.map((l) => `${l.name} ${l.percent.toFixed(1)}%`).join(', ')}.`;
  return svgDoc({ width, height, title: 'Languages', desc, body, style: GROW_STYLE });
}
