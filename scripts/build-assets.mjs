import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { THEMES } from './lib/theme.mjs';
import { renderHero } from './lib/assets/hero.mjs';
import { PRODUCTS, renderProductCard } from './lib/assets/cards.mjs';
import { STACK_ICONS, renderStack } from './lib/assets/stack.mjs';
import { BUTTONS, renderButton } from './lib/assets/buttons.mjs';

export function renderStaticAssets({ icons, stafficMark }) {
  const files = {};
  for (const theme of Object.values(THEMES)) {
    files[`hero-${theme.name}.svg`] = renderHero(theme);
    for (const product of PRODUCTS) files[`card-${product.id}-${theme.name}.svg`] = renderProductCard(product, theme, { stafficMark });
    files[`stack-${theme.name}.svg`] = renderStack(theme, icons);
    for (const button of BUTTONS) files[`btn-${button.id}-${theme.name}.svg`] = renderButton(button, theme);
  }
  return files;
}

export async function loadVendor(dir = 'assets/vendor') {
  const icons = {};
  for (const name of STACK_ICONS) {
    for (const theme of Object.keys(THEMES)) icons[`${name}-${theme}`] = await readFile(join(dir, 'skillicons', `${name}-${theme}.svg`), 'utf8');
  }
  return { icons, stafficMark: await readFile(join(dir, 'staffic-mark.svg'), 'utf8') };
}

export async function main(out = 'assets') {
  const files = renderStaticAssets(await loadVendor());
  await mkdir(out, { recursive: true });
  for (const [name, content] of Object.entries(files)) await writeFile(join(out, name), content);
  console.log(`build-assets: wrote ${Object.keys(files).length} files to ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
