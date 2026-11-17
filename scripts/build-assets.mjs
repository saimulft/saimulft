import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { THEMES } from './lib/theme.mjs';
import { renderHero } from './lib/assets/hero.mjs';
import { PRODUCTS, renderExperienceCard, renderProductCard } from './lib/assets/cards.mjs';
import { STACK_ICONS, renderStack } from './lib/assets/stack.mjs';
import { BUTTONS, renderButton } from './lib/assets/buttons.mjs';

export function renderStaticAssets({ icons }) {
  const files = {};
  for (const theme of Object.values(THEMES)) {
    files[`hero-${theme.name}.svg`] = renderHero(theme);
    files[`card-developerlook-${theme.name}.svg`] = renderExperienceCard(theme);
    for (const product of PRODUCTS) files[`card-${product.id}-${theme.name}.svg`] = renderProductCard(product, theme);
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
  return { icons };
}

export async function main(out = 'assets') {
  const files = renderStaticAssets(await loadVendor());
  await mkdir(out, { recursive: true });
  // Drop assets this build no longer makes (vendor files are never touched).
  for (const name of await readdir(out)) if (/^(hero|card|stack|btn)-.*\.svg$/.test(name) && !(name in files)) await rm(join(out, name));
  for (const [name, content] of Object.entries(files)) await writeFile(join(out, name), content);
  console.log(`build-assets: wrote ${Object.keys(files).length} files to ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
