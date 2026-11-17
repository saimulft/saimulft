import { cardRect, el, svgDoc, text } from '../svg.mjs';
import { dotPattern, label, labelWidth, numeral, numeralWidth, signalDot } from './brand.mjs';

// Facts come from saimulislam.com (client/src/content): proof.ts and cases.ts. Keep every number exact.
// Exactly one fact per card is `lit`: the real result, filled Signal. The rest stay outlines.
export const PRODUCTS = [
  {
    id: 'staffic',
    name: 'Staffic',
    kind: 'Product · Time tracking SaaS',
    lines: ['Trackers for Windows, macOS and Linux feed one', 'web app for timesheets, payroll and invoices.'],
    facts: [
      { value: '1,000+', label: 'Users', lit: true },
      { value: '16', label: 'Modules' },
      { value: '4', label: 'Platforms' },
    ],
    link: 'staffic.io',
  },
  {
    id: 'bundlewise',
    name: 'Bundlewise',
    kind: 'Product · AI CRM with native MCP',
    lines: ['One CRM for forms, chats and campaign replies,', 'with AI agents working under the same roles.'],
    facts: [
      { value: '200+', label: 'MCP tools', lit: true },
      { value: '17', label: 'Modules' },
      { value: '10+', label: 'Inbox channels' },
    ],
    link: 'bundlewise.app',
  },
];

export const EXPERIENCE = {
  id: 'developerlook',
  name: 'DeveloperLook',
  kind: 'Experience · Founder and lead · Since 2018',
  lines: ["I lead the team that delivers software inside", "customers' businesses, from discovery to production."],
  practices: ['Discovery', 'Solution design', 'Production delivery', 'Team lead'],
  fact: { value: '1,250+', label: 'Products shipped since 2018', sub: 'Clients: US, UK, Australia' },
};

function eyebrow(x, y, content, theme) {
  return signalDot(x + 4, y - 4, 4) + label(x + 16, y, content, { size: 11, fill: theme.eyebrow });
}

export function renderProductCard(product, theme) {
  const width = 410;
  const height = 270;
  let body =
    cardRect(width, height, theme, 20) +
    eyebrow(28, 44, product.kind, theme) +
    text(28, 84, product.name, { size: 26, weight: 600, fill: theme.text, extra: { 'letter-spacing': -0.4 } }) +
    product.lines.map((line, i) => text(28, 114 + i * 21, line, { size: 14, fill: theme.textSecondary })).join('');
  let x = 28;
  for (const fact of product.facts) {
    body += numeral(x, 206, fact.value, { size: 48, lit: fact.lit, ground: theme.surface, theme });
    body += label(x + 1, 230, fact.label, { size: 10, fill: theme.textSecondary });
    x += Math.max(numeralWidth(fact.value, 48), labelWidth(fact.label, 10)) + 26;
  }
  body += text(width - 28, 84, `${product.link} ↗`, { size: 13, weight: 600, fill: theme.link, anchor: 'end' });
  const lit = product.facts.find((f) => f.lit);
  return svgDoc({
    width,
    height,
    title: `${product.name}: ${product.kind.replace('Product · ', '')}`,
    desc: `${product.lines.join(' ')} ${product.facts.map((f) => `${f.value} ${f.label.toLowerCase()}`).join(', ')}. ${lit.value} ${lit.label.toLowerCase()} is the highlighted result.`,
    body,
  });
}

export function renderExperienceCard(theme, card = EXPERIENCE) {
  const width = 840;
  const height = 250;
  const field = { x: 548, y: 20, width: 272, height: 210 };
  let body =
    `<defs>${dotPattern(`field-${theme.name}`, { color: theme.dot, opacity: theme.dotOpacity })}</defs>` +
    cardRect(width, height, theme, 20) +
    el('rect', { ...field, rx: 14, fill: theme.field }) +
    el('rect', { ...field, rx: 14, fill: `url(#field-${theme.name})` }) +
    eyebrow(32, 50, card.kind, theme) +
    text(32, 98, card.name, { size: 32, weight: 600, fill: theme.text, extra: { 'letter-spacing': -0.7 } }) +
    card.lines.map((line, i) => text(32, 132 + i * 24, line, { size: 16, fill: theme.textSecondary })).join('');
  let x = 32;
  for (const practice of card.practices) {
    const w = labelWidth(practice, 10.5) + 24;
    body += el('rect', { x: x + 0.5, y: 190.5, width: w, height: 30, rx: 8, fill: theme.tile, stroke: theme.tileBorder });
    body += label(x + 12, 209.5, practice, { size: 10.5, fill: theme.text });
    x += w + 8;
  }
  const cx = field.x + 28;
  body += numeral(cx, 132, card.fact.value, { size: 72, lit: true, ground: theme.field, theme });
  body += label(cx + 2, 166, card.fact.label, { size: 10.5, fill: theme.text });
  body += label(cx + 2, 188, card.fact.sub, { size: 10.5, fill: theme.textSecondary });
  return svgDoc({
    width,
    height,
    title: `${card.name}: founder and lead since 2018`,
    desc: `${card.lines.join(' ')} ${card.practices.join(', ')}. ${card.fact.value} ${card.fact.label.toLowerCase()}. Clients in the US, UK and Australia.`,
    body,
  });
}

