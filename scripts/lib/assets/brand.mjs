// Brand-book parts shared by the static README assets: dot grounds, the Signal dot,
// Geist Mono labels and outline numerals.
import { el, esc, monoWidth } from '../svg.mjs';
import { BRAND } from '../theme.mjs';

// Personal variant: uppercase labels at +10% tracking.
const TRACKING = 0.1;

// Dots are the grid we plan on: 1px dots on a 20px pitch.
export function dotPattern(id, { color, opacity, pitch = 20 }) {
  return `<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${color}" fill-opacity="${opacity}"/></pattern>`;
}

// Uppercase Geist Mono label, +10% tracking, weight 500.
export function label(x, y, content, { size = 11, fill, anchor, weight = 500 } = {}) {
  return el(
    'text',
    { x, y, fill, class: 'mono', 'font-size': size, 'font-weight': weight, 'letter-spacing': Math.round(size * TRACKING * 100) / 100, 'text-anchor': anchor },
    esc(String(content).toUpperCase()),
  );
}

export function labelWidth(content, size = 11) {
  return monoWidth(content, size, TRACKING);
}

// The one lit dot.
export function signalDot(cx, cy, r = 4, { ring = 0 } = {}) {
  return (ring ? el('circle', { cx, cy, r: r + ring, fill: BRAND.signal, 'fill-opacity': 0.2 }) : '') + el('circle', { cx, cy, r, fill: BRAND.signal });
}

// Rough advance of Instrument Sans (or the system fallback) SemiBold figures at -4% tracking.
export function numeralWidth(value, size) {
  let units = 0;
  for (const ch of String(value)) units += /[,.]/.test(ch) ? 0.28 : 0.6;
  return units * size;
}

// Outline numerals: the outline is the target, the Signal fill is the result.
// The stroke is painted under a fill in the ground colour, so only its outer half shows:
// a 3px stroke draws the book's 1.5px line. Never below 48px.
export function numeral(x, y, value, { size, lit = false, ground, theme }) {
  if (size < 48) throw new Error('Outline numerals start at 48px');
  return el(
    'text',
    {
      x,
      y,
      'font-size': size,
      'font-weight': 600,
      'letter-spacing': Math.round(size * -0.04 * 100) / 100,
      fill: lit ? BRAND.signal : ground,
      stroke: lit ? BRAND.signal : theme.numeralStroke,
      'stroke-opacity': lit ? undefined : theme.numeralStrokeOpacity,
      'stroke-width': 3,
      'stroke-linejoin': 'round',
      'paint-order': 'stroke',
      style: 'font-variant-numeric:tabular-nums',
    },
    esc(value),
  );
}
