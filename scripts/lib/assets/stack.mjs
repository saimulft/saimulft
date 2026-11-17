import { cardRect, el, nestSvg, svgDoc, text, textWidth } from '../svg.mjs';
import { label } from './brand.mjs';

// Icons come from skillicons.dev (MIT, vendored in assets/vendor/skillicons). "text:" items have no icon there.
export const STACK = [
  { label: 'Languages', items: ['ts', 'js', 'php', 'py', 'dart'] },
  { label: 'Front end', items: ['react', 'nextjs', 'vite', 'tailwind'] },
  { label: 'Back end and data', items: ['nodejs', 'text:Express', 'laravel', 'text:MongoDB', 'postgres', 'mysql', 'redis', 'prisma', 'supabase'] },
  { label: 'Realtime and apps', items: ['text:Socket.IO', 'electron', 'flutter'] },
  { label: 'AI and auth', items: ['text:Claude API', 'text:MCP', 'text:OpenAI', 'text:Google Gemini', 'text:OAuth'] },
  { label: 'Cloud and tooling', items: ['cloudflare', 'vercel', 'aws', 'docker', 'githubactions', 'text:Stripe', 'vitest', 'text:Playwright'] },
];

const NAMES = {
  ts: 'TypeScript', js: 'JavaScript', php: 'PHP', py: 'Python', dart: 'Dart', react: 'React', nextjs: 'Next.js', vite: 'Vite',
  tailwind: 'Tailwind CSS', nodejs: 'Node.js', laravel: 'Laravel', supabase: 'Supabase', postgres: 'PostgreSQL', mysql: 'MySQL',
  prisma: 'Prisma', redis: 'Redis', electron: 'Electron', flutter: 'Flutter', cloudflare: 'Cloudflare',
  vercel: 'Vercel', aws: 'AWS', docker: 'Docker', githubactions: 'GitHub Actions', vitest: 'Vitest',
};

export const STACK_ICONS = [...new Set(STACK.flatMap((group) => group.items.filter((item) => !item.startsWith('text:'))))];

const itemName = (item) => (item.startsWith('text:') ? item.slice(5) : NAMES[item]);

// Only the neutral skillicons tiles are recoloured, in either attribute order;
// brand tiles such as JavaScript's yellow square are part of the logo and stay.
const NEUTRAL_TILE = /(<rect width="256" height="256" (?:rx="60" )?fill=")#(?:242938|F4F2ED|F4F4ED)("(?: rx="60")?\/>)/i;

export function retile(source, color) {
  return source.replace(NEUTRAL_TILE, `$1${color}$2`);
}

export function renderStack(theme, icons) {
  const width = 840;
  const padding = 28;
  const rowHeight = 60;
  const tile = 44;
  const gap = 10;
  const itemsX = 210;
  const height = padding * 2 + STACK.length * rowHeight - (rowHeight - tile);
  let body = cardRect(width, height, theme, 20);
  STACK.forEach((group, row) => {
    const y = padding + row * rowHeight;
    body += label(28, y + tile / 2 + 4, group.label, { size: 11, fill: theme.textSecondary });
    let x = itemsX;
    for (const item of group.items) {
      if (item.startsWith('text:')) {
        const label = item.slice(5);
        const chipWidth = textWidth(label, 13) + 28;
        body += el('rect', { x: x + 0.5, y: y + 0.5, width: chipWidth - 1, height: tile - 1, rx: 10, fill: theme.tile, stroke: theme.tileBorder });
        body += text(x + chipWidth / 2, y + tile / 2 + 4.5, label, { size: 13, weight: 600, fill: theme.text, anchor: 'middle' });
        x += chipWidth + gap;
      } else {
        const source = icons[`${item}-${theme.name}`];
        if (!source) throw new Error(`Missing icon: ${item}-${theme.name}`);
        body += nestSvg(retile(source, theme.tile), { x, y, width: tile, height: tile, prefix: `${item}-${theme.name}` });
        x += tile + gap;
      }
    }
  });
  const desc = `${STACK.map((group) => `${group.label}: ${group.items.map(itemName).join(', ')}`).join('. ')}.`;
  return svgDoc({ width, height, title: 'Tech stack', desc, body });
}
