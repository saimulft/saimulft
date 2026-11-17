import { el, svgDoc, text, textWidth } from '../svg.mjs';

// One main action in orange; the rest are line buttons.
export const BUTTONS = [
  { id: 'email', label: 'Email me', variant: 'primary', icon: '→' },
  { id: 'linkedin', label: 'LinkedIn', variant: 'secondary', icon: '↗' },
];

export function renderButton(button, theme) {
  const height = 48;
  const size = 16;
  const padX = 22;
  const primary = button.variant === 'primary';
  const labelWidth = textWidth(button.label, size);
  const width = Math.round(labelWidth + padX * 2 + (button.icon ? 26 : 0));
  const color = primary ? theme.buttonPrimaryText : theme.buttonSecondaryText;
  const body =
    el('rect', {
      x: 0.5,
      y: 0.5,
      width: width - 1,
      height: height - 1,
      rx: 12,
      fill: primary ? theme.buttonPrimary : theme.buttonSecondary,
      stroke: primary ? theme.buttonPrimary : theme.buttonBorder,
      'stroke-opacity': primary ? undefined : theme.buttonBorderOpacity,
    }) +
    text(padX, 30, button.label, { size, weight: 600, fill: color }) +
    (button.icon ? text(padX + labelWidth + 12, 30, button.icon, { size, weight: 600, fill: color }) : '');
  return svgDoc({ width, height, title: button.label, desc: `${button.label} button`, body });
}
