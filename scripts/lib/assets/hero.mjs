import { cardRect, el, svgDoc, text } from '../svg.mjs';
import { markWidth, renderMark } from './mark.mjs';

export function renderHero(theme) {
  const width = 840;
  const height = 260;
  const markHeight = 150;
  const markX = 606;
  const markY = 55;
  const cursorX = markX + markWidth(markHeight) + 14;
  const style = '.cursor{animation:blink 1.1s steps(1) infinite}@keyframes blink{50%{opacity:0}}';
  const body =
    `<defs><pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="${theme.dot}"/></pattern></defs>` +
    cardRect(width, height, theme, 16) +
    el('rect', { x: 560, y: 24, width: 256, height: 212, fill: 'url(#dots)' }) +
    renderMark({ x: markX, y: markY, height: markHeight, theme }) +
    el('rect', { x: cursorX, y: markY + markHeight - 10, width: 44, height: 10, rx: 3, fill: theme.accent, class: 'cursor' }) +
    text(40, 80, 'Founder & CEO at DeveloperLook', { size: 15, weight: 600, fill: theme.eyebrow, extra: { 'letter-spacing': 0.8 } }) +
    text(38, 140, 'Saimul Islam', { size: 54, weight: 700, fill: theme.text, extra: { 'letter-spacing': -1 } }) +
    text(40, 182, 'I build SaaS products, web apps and AI automation', { size: 19, fill: theme.textSecondary }) +
    text(40, 208, 'that help businesses run faster.', { size: 19, fill: theme.textSecondary });
  return svgDoc({
    width,
    height,
    title: 'Saimul Islam, Founder & CEO at DeveloperLook',
    desc: 'I build SaaS products, web apps and AI automation that help businesses run faster.',
    body,
    style,
  });
}
