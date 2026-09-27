import { FONT_STACK } from './theme.mjs';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const numberFormat = new Intl.NumberFormat('en-US');

export const r = (n) => Math.round(n * 100) / 100;

export function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

export function fmt(n) {
  return numberFormat.format(Math.round(n));
}

export function plural(n, word) {
  return `${fmt(n)} ${n === 1 ? word : `${word}s`}`;
}

export function attrs(map) {
  return Object.entries(map)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => ` ${key}="${esc(typeof value === 'number' ? r(value) : value)}"`)
    .join('');
}

export function el(tag, attributes = {}, ...children) {
  const body = children.flat().join('');
  return body ? `<${tag}${attrs(attributes)}>${body}</${tag}>` : `<${tag}${attrs(attributes)}/>`;
}

export function text(x, y, content, { size = 13, fill, weight, anchor, extra = {} } = {}) {
  return el('text', { x, y, fill, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor, ...extra }, esc(content));
}

// Rough glyph widths for a system sans-serif; good enough to size chips and truncate labels.
export function textWidth(value, size) {
  let units = 0;
  for (const ch of String(value)) {
    if (/[ijlI.,:;'|!]/.test(ch) || ch === ' ') units += 0.3;
    else if (/[mwMW@]/.test(ch)) units += 0.86;
    else if (/[A-Z0-9%&+#?]/.test(ch)) units += 0.64;
    else units += 0.54;
  }
  return units * size;
}

export function truncate(value, maxWidth, size) {
  if (textWidth(value, size) <= maxWidth) return String(value);
  const chars = [...String(value)];
  while (chars.length > 1 && textWidth(`${chars.join('')}…`, size) > maxWidth) chars.pop();
  return `${chars.join('')}…`;
}

export const GROW_STYLE =
  '.gy,.gx{transform-box:fill-box;animation-duration:.7s;animation-timing-function:cubic-bezier(.2,.7,.2,1);animation-fill-mode:both}' +
  '.gy{transform-origin:50% 100%;animation-name:gy}.gx{transform-origin:0 50%;animation-name:gx}' +
  '@keyframes gy{from{transform:scaleY(0)}}@keyframes gx{from{transform:scaleX(0)}}';

export function svgDoc({ width, height, title, desc, body, style = '' }) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc">` +
    `<title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(desc)}</desc>` +
    `<style>text{font-family:${FONT_STACK}}${style}@media (prefers-reduced-motion: reduce){*{animation:none!important}}</style>` +
    body +
    '</svg>'
  );
}

export function cardRect(width, height, theme, radius = 12) {
  return el('rect', { x: 0.5, y: 0.5, width: width - 1, height: height - 1, rx: radius, fill: theme.surface, stroke: theme.border });
}

export function columnPath(x, baseline, width, height, radius = 4) {
  if (!(height > 0)) return '';
  const rr = Math.min(radius, height, width / 2);
  const top = baseline - height;
  return `M${r(x)} ${r(baseline)}V${r(top + rr)}Q${r(x)} ${r(top)} ${r(x + rr)} ${r(top)}H${r(x + width - rr)}Q${r(x + width)} ${r(top)} ${r(x + width)} ${r(top + rr)}V${r(baseline)}Z`;
}

export function rowPath(x, centerY, length, thickness, radius = 4) {
  if (!(length > 0)) return '';
  const rr = Math.min(radius, length, thickness / 2);
  const top = centerY - thickness / 2;
  const bottom = centerY + thickness / 2;
  const end = x + length;
  return `M${r(x)} ${r(top)}H${r(end - rr)}Q${r(end)} ${r(top)} ${r(end)} ${r(top + rr)}V${r(bottom - rr)}Q${r(end)} ${r(bottom)} ${r(end - rr)} ${r(bottom)}H${r(x)}Z`;
}

export function niceScale(maxValue, targetTicks = 4) {
  if (!(maxValue > 0)) return { max: 4, ticks: [0, 1, 2, 3, 4] };
  const rough = maxValue / targetTicks;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough));
  const max = Math.ceil(maxValue / step) * step;
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  return { max, ticks };
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [red, green, blue] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function prefixIds(markup, prefix) {
  return markup
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}-${id})`)
    .replace(/\b((?:xlink:)?href)="#([^"]+)"/g, (_, attr, id) => `${attr}="#${prefix}-${id}"`);
}

export function nestSvg(source, { x, y, width, height, prefix }) {
  const open = source.match(/<svg\b[^>]*>/);
  if (!open) throw new Error('Not an SVG document');
  const viewBox = open[0].match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${width} ${height}`;
  const inner = source.slice(open.index + open[0].length, source.lastIndexOf('</svg>'));
  return `<svg${attrs({ x, y, width, height, viewBox })}>${prefix ? prefixIds(inner, prefix) : inner}</svg>`;
}
