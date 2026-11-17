// Saimul Islam's personal brand tokens for every generated SVG: his orange (#F2502A, from
// hypential/creatives/kit/personal.css) on the Hypential system's Midnight, Ink and Mist grounds.
// Checked with the dataviz palette validator: text >= 4.5:1 and marks >= 3:1 on `surface` (spec section 10).
// SVGs load inside GitHub's <img> tags, which can't fetch web fonts, so each stack names the
// brand face first and falls back to system fonts.
export const FONT_STACK = "'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
export const MONO_STACK = "'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

// The brand book's named colours.
export const BRAND = {
  midnight: '#213343',
  night: '#192836',
  harbor: '#2D4358',
  steel: '#94A6B8',
  fog: '#D9E2EA',
  // His orange: the hero ground, the one lit dot, the main action and the number that moved.
  signal: '#F2502A',
  // Behind words on orange that need more contrast (personal.css --sp-deep).
  deep: '#E8471F',
  // The deeper corner of the orange ground (personal.css --sp-shade).
  shade: '#96260A',
  ember: '#C93F1B',
  ink: '#1B2633',
  ink2: '#475569',
  ink3: '#64748B',
  line: '#E2E8EF',
  line2: '#CDD6E0',
  mist: '#F5F8FA',
  paper: '#FFFFFF',
  white: '#FFFFFF',
};

const B = BRAND;

export const THEMES = {
  dark: {
    name: 'dark',
    surface: B.midnight,
    border: B.harbor,
    grid: B.harbor,
    // All text on dark is white.
    text: B.white,
    textSecondary: B.white,
    textMuted: B.white,
    series: B.steel,
    highlight: B.signal,
    other: B.ink3,
    accent: B.signal,
    eyebrow: B.white,
    link: B.white,
    // Dot grounds: white dots at 8% on Night.
    field: B.night,
    dot: B.white,
    dotOpacity: 0.08,
    tile: B.night,
    tileBorder: B.harbor,
    // Outline numerals: Fog stroke at 50% on navy; the fill is the ground colour.
    numeralStroke: B.fog,
    numeralStrokeOpacity: 0.5,
    buttonPrimary: B.signal,
    buttonPrimaryText: B.white,
    buttonSecondary: B.midnight,
    buttonSecondaryText: B.white,
    buttonBorder: B.white,
    buttonBorderOpacity: 0.24,
  },
  light: {
    name: 'light',
    surface: B.paper,
    border: B.line,
    grid: B.line,
    text: B.ink,
    textSecondary: B.ink2,
    textMuted: B.ink3,
    series: B.midnight,
    highlight: B.signal,
    other: B.line2,
    accent: B.signal,
    eyebrow: B.ink2,
    link: B.ember,
    // Slate field: Midnight dots at 16% on Mist.
    field: B.mist,
    dot: B.midnight,
    dotOpacity: 0.16,
    tile: B.mist,
    tileBorder: B.line,
    numeralStroke: B.ink,
    numeralStrokeOpacity: 1,
    buttonPrimary: B.signal,
    buttonPrimaryText: B.white,
    buttonSecondary: B.paper,
    buttonSecondaryText: B.ink,
    buttonBorder: B.line2,
    buttonBorderOpacity: 1,
  },
};
