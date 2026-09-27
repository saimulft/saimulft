import { el, svgDoc, text, textWidth } from '../svg.mjs';

export const BUTTONS = [
  { id: 'start', label: 'Start a project', variant: 'primary' },
  { id: 'email', label: 'Email me', variant: 'secondary' },
];

export function renderButton(button, theme) {
  const height = 48;
  const size = 16;
  const padX = 24;
  const primary = button.variant === 'primary';
  const labelWidth = textWidth(button.label, size);
  const width = Math.round(labelWidth + padX * 2 + (primary ? 26 : 0));
  const body =
    el('rect', {
      x: 0.5,
      y: 0.5,
      width: width - 1,
      height: height - 1,
      rx: 12,
      fill: primary ? theme.buttonPrimary : theme.surface,
      stroke: primary ? theme.buttonPrimary : theme.buttonBorder,
    }) +
    text(padX, 30, button.label, { size, weight: 600, fill: primary ? theme.buttonPrimaryText : theme.text }) +
    (primary ? text(padX + labelWidth + 12, 30, '→', { size, weight: 600, fill: theme.buttonPrimaryText }) : '');
  return svgDoc({ width, height, title: button.label, desc: `${button.label} button`, body });
}
