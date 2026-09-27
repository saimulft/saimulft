import { el, r } from '../svg.mjs';

// The DeveloperLook chevron, traced from the official logo (developerlook.com).
export const MARK_BOX = { x: 51, y: 40, width: 145, height: 164 };
const TOP = 'M129.019 118.715V118.707L128.875 118.572L56.0295 50.2494C54.0152 48.3601 53.7259 45.8174 54.6445 43.7362C55.5647 41.6513 57.7023 40.0245 60.5804 40.0245H106.241C112.974 40.0245 119.431 42.5296 124.176 46.9799L191.771 110.398L192.502 111.084C194.532 113.149 195.752 115.905 195.752 118.919V119.248C195.67 122.01 194.554 124.544 192.743 126.5L149.412 167.141C148.811 152.192 144.964 136.264 130.243 119.873C129.931 119.517 129.56 119.191 129.212 118.886Z';
const BOTTOM = 'M143.826 172.497L120.24 196.083C115.698 200.639 109.524 203.196 103.09 203.196H60.1689C54.4094 203.196 51.5224 196.229 55.5979 192.158L123.972 123.799L124.618 123.152C125.057 123.572 125.476 123.992 125.877 124.412C139.939 141.11 143.382 157.304 143.821 172.502Z';

export function markWidth(height) {
  return MARK_BOX.width * (height / MARK_BOX.height);
}

export function renderMark({ x, y, height, theme }) {
  const scale = Math.round((height / MARK_BOX.height) * 10000) / 10000;
  return el(
    'g',
    { transform: `translate(${r(x - MARK_BOX.x * scale)} ${r(y - MARK_BOX.y * scale)}) scale(${scale})` },
    el('path', { d: TOP, fill: theme.mark }),
    el('path', { d: BOTTOM, fill: theme.markAlt }),
  );
}
