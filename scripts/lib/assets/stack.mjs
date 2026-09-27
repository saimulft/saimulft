import { cardRect, el, nestSvg, svgDoc, text, textWidth } from '../svg.mjs';

// Icons come from skillicons.dev (MIT, vendored in assets/vendor/skillicons). "text:" items have no icon there.
export const STACK = [
  { label: 'Languages', items: ['ts', 'js', 'php', 'py', 'dart'] },
  { label: 'Frontend', items: ['react', 'nextjs', 'vite', 'tailwind'] },
  { label: 'Backend & data', items: ['nodejs', 'laravel', 'supabase', 'postgres', 'mysql', 'prisma', 'redis'] },
  { label: 'Commerce & CMS', items: ['wordpress', 'text:WooCommerce', 'text:Shopify'] },
  { label: 'Apps', items: ['electron', 'flutter'] },
  { label: 'Cloud & tooling', items: ['cloudflare', 'vercel', 'aws', 'docker', 'githubactions', 'vitest', 'text:Playwright'] },
  { label: 'AI', items: ['text:OpenAI', 'text:Anthropic Claude', 'text:Google Gemini'] },
];

const NAMES = {
  ts: 'TypeScript', js: 'JavaScript', php: 'PHP', py: 'Python', dart: 'Dart', react: 'React', nextjs: 'Next.js', vite: 'Vite',
  tailwind: 'Tailwind CSS', nodejs: 'Node.js', laravel: 'Laravel', supabase: 'Supabase', postgres: 'PostgreSQL', mysql: 'MySQL',
  prisma: 'Prisma', redis: 'Redis', wordpress: 'WordPress', electron: 'Electron', flutter: 'Flutter', cloudflare: 'Cloudflare',
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
  let body = cardRect(width, height, theme, 14);
  STACK.forEach((group, row) => {
    const y = padding + row * rowHeight;
    body += text(28, y + tile / 2 + 5, group.label, { size: 14, weight: 600, fill: theme.textSecondary });
    let x = itemsX;
    for (const item of group.items) {
      if (item.startsWith('text:')) {
        const label = item.slice(5);
        const chipWidth = textWidth(label, 13) + 28;
        body += el('rect', { x, y, width: chipWidth, height: tile, rx: 10, fill: theme.tile });
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
