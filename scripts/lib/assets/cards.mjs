import { cardRect, el, nestSvg, svgDoc, text, textWidth } from '../svg.mjs';
import { markWidth, renderMark } from './mark.mjs';

export const PRODUCTS = [
  {
    id: 'developerlook',
    name: 'DeveloperLook',
    subtitle: 'Software development agency, since 2018',
    lines: ['Web and mobile apps, SaaS, e-commerce, AI and', 'automation for startups and growing businesses.'],
    chips: ['1,000+ projects', '5-star rated', 'Top Rated Plus'],
    link: 'developerlook.com',
    logo: 'mark',
  },
  {
    id: 'staffic',
    name: 'Staffic.io',
    subtitle: 'Workforce management SaaS',
    lines: ['Time tracking, screenshots, budgets, payroll', 'and invoicing, with web and desktop apps.'],
    chips: ['Time tracking', 'Payroll', 'Free for teams up to 3'],
    link: 'staffic.io',
    logo: 'staffic',
  },
];

function chipRow(labels, { x, y, height, theme }) {
  let cursor = x;
  return labels
    .map((label) => {
      const width = textWidth(label, 12) + 22;
      const chip = el('rect', { x: cursor, y, width, height, rx: 7, fill: theme.tile }) + text(cursor + width / 2, y + height / 2 + 4.5, label, { size: 12, fill: theme.text, anchor: 'middle' });
      cursor += width + 8;
      return chip;
    })
    .join('');
}

export function renderProductCard(product, theme, { stafficMark }) {
  const width = 410;
  const height = 240;
  const logo =
    product.logo === 'mark'
      ? el('rect', { x: 28, y: 28, width: 56, height: 56, rx: 12, fill: theme.tile }) + renderMark({ x: 28 + (56 - markWidth(34)) / 2, y: 39, height: 34, theme })
      : nestSvg(stafficMark, { x: 28, y: 28, width: 56, height: 56, prefix: `staffic-${theme.name}` });
  const body =
    cardRect(width, height, theme, 14) +
    logo +
    text(100, 52, product.name, { size: 18, weight: 600, fill: theme.text }) +
    text(100, 74, product.subtitle, { size: 13, fill: theme.textSecondary }) +
    product.lines.map((line, i) => text(28, 118 + i * 22, line, { size: 14, fill: theme.text })).join('') +
    chipRow(product.chips, { x: 28, y: 162, height: 28, theme }) +
    text(28, 218, `${product.link} ↗`, { size: 13, weight: 600, fill: theme.link });
  return svgDoc({
    width,
    height,
    title: `${product.name}: ${product.subtitle}`,
    desc: `${product.lines.join(' ')} ${product.chips.join(', ')}.`,
    body,
  });
}
