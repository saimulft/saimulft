import { el, svgDoc, text, textWidth } from '../svg.mjs';
import { BRAND } from '../theme.mjs';
import { label } from './brand.mjs';

export const HERO = {
  eyebrow: 'Forward Deployed Engineer · Solutions Architect',
  name: 'Saimul Islam',
  lines: ["I build software inside customers' businesses", 'and stay until it works.'],
  status: 'Open to Forward Deployed Engineer and Solutions Architect roles',
};

const W = 840;
const H = 320;

// His personal ground (hypential/creatives/kit/personal.css, the live profile cover):
// orange with a soft light top right, a deeper corner bottom left and the white graph grid
// (lines every 27px, a stronger one every 108px, through the centre), softer behind the words.
function ground() {
  const cx = W / 2;
  const cy = H / 2;
  const minor = 27;
  const major = 108;
  const off = (c, step) => ((c % step) + step) % step;
  const cross = (x, y) => `<path d="M${x - 10} ${y}h20M${x} ${y - 10}v20" stroke="${BRAND.white}" stroke-width="2" stroke-opacity="0.8" fill="none"/>`;
  const crossRows = [cy - major, cy + major];
  const crossCols = [cx + 2 * major, cx + 3 * major];
  return (
    '<defs>' +
    `<pattern id="hero-minor" x="${off(cx, minor)}" y="${off(cy, minor)}" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse"><path d="M0 ${minor}V0H${minor}" fill="none" stroke="${BRAND.white}" stroke-opacity="0.13" stroke-width="1"/></pattern>` +
    `<pattern id="hero-major" x="${off(cx, major)}" y="${off(cy, major)}" width="${major}" height="${major}" patternUnits="userSpaceOnUse"><path d="M0 ${major}V0H${major}" fill="none" stroke="${BRAND.white}" stroke-opacity="0.22" stroke-width="1.5"/></pattern>` +
    '<radialGradient id="hero-soft" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="0.8" stop-color="#fff"/></radialGradient>' +
    `<mask id="hero-mask"><rect width="${W}" height="${H}" fill="url(#hero-soft)"/></mask>` +
    `<radialGradient id="hero-light" cx="${W - 60}" cy="30" r="340" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="rgb(255,150,115)" stop-opacity="0.55"/><stop offset="0.4" stop-color="rgb(255,120,85)" stop-opacity="0.25"/><stop offset="0.72" stop-color="rgb(255,92,53)" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="hero-shade" cx="0" cy="${H}" r="440" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${BRAND.shade}" stop-opacity="0.24"/><stop offset="0.7" stop-color="${BRAND.shade}" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="hero-clip"><rect width="${W}" height="${H}" rx="20"/></clipPath>` +
    '</defs>' +
    el(
      'g',
      { 'clip-path': 'url(#hero-clip)' },
      el('rect', { width: W, height: H, fill: BRAND.signal }),
      el('rect', { width: W, height: H, fill: 'url(#hero-light)' }),
      el('rect', { width: W, height: H, fill: 'url(#hero-shade)' }),
      el('g', { mask: 'url(#hero-mask)' }, el('rect', { width: W, height: H, fill: 'url(#hero-minor)' }), el('rect', { width: W, height: H, fill: 'url(#hero-major)' })),
      crossRows.flatMap((y) => crossCols.map((x) => cross(x, y))).join(''),
    )
  );
}

// The hero is orange in both themes: every word on it is white.
export function renderHero(theme) {
  const statusSize = 15;
  const pillWidth = Math.round(textWidth(HERO.status, statusSize) + 64);
  const style = '.rise{animation:rise .7s cubic-bezier(.22,1,.36,1) both}@keyframes rise{from{opacity:0;transform:translateY(8px)}}';
  const body =
    ground() +
    (theme.name === 'dark' ? el('rect', { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 20, fill: 'none', stroke: BRAND.white, 'stroke-opacity': 0.12 }) : '') +
    el(
      'g',
      { class: 'rise' },
      label(46, 74, HERO.eyebrow, { size: 12, fill: BRAND.white }),
      text(42, 148, HERO.name, { size: 66, weight: 600, fill: BRAND.white, extra: { 'letter-spacing': -2 } }),
      HERO.lines.map((line, i) => text(46, 194 + i * 29, line, { size: 22, fill: BRAND.white })).join(''),
      // Words that need more contrast sit on the deeper orange.
      el('rect', { x: 46, y: 248, width: pillWidth, height: 40, rx: 20, fill: BRAND.deep, stroke: BRAND.white, 'stroke-opacity': 0.35 }),
      el('circle', { cx: 68, cy: 268, r: 4.5, fill: BRAND.white }),
      text(84, 273.5, HERO.status, { size: statusSize, weight: 600, fill: BRAND.white }),
    );
  return svgDoc({
    width: W,
    height: H,
    title: `${HERO.name}, ${HERO.eyebrow.replace(' · ', ' and ')}`,
    desc: `${HERO.lines.join(' ')} ${HERO.status}.`,
    body,
    style,
  });
}
