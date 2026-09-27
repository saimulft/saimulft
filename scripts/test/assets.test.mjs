import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { THEMES } from '../lib/theme.mjs';
import { renderHero } from '../lib/assets/hero.mjs';
import { PRODUCTS, renderProductCard } from '../lib/assets/cards.mjs';
import { STACK, STACK_ICONS, renderStack, retile } from '../lib/assets/stack.mjs';
import { BUTTONS, renderButton } from '../lib/assets/buttons.mjs';
import { renderStaticAssets } from '../build-assets.mjs';
import { assertWellFormedXml } from './helpers.mjs';

const ICON = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 256 256"><g transform="translate(0, 0)"><svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="none" viewBox="0 0 256 256"><defs><linearGradient id="a"/></defs><rect width="256" height="256" fill="${fill}" rx="60"/><path fill="url(#a)" d="M0 0h9v9z"/></svg></g></svg>`;
const icons = Object.fromEntries(STACK_ICONS.flatMap((name) => [[`${name}-dark`, ICON('#242938')], [`${name}-light`, ICON('#F4F2ED')]]));
const stafficMark = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 589 584" fill="none"><rect width="589" height="584" rx="122" fill="#673DE6"/></svg>';

for (const theme of Object.values(THEMES)) {
  test(`hero (${theme.name}) carries the name, role and reduced-motion guard`, () => {
    const svg = renderHero(theme);
    assertWellFormedXml(svg);
    for (const value of ['Saimul Islam', 'Founder &amp; CEO at DeveloperLook', 'that help businesses run faster.', 'prefers-reduced-motion', 'class="cursor"']) {
      assert.ok(svg.includes(value), value);
    }
  });

  test(`product cards (${theme.name}) render name, copy and chips`, () => {
    for (const product of PRODUCTS) {
      const svg = renderProductCard(product, theme, { stafficMark });
      assertWellFormedXml(svg);
      assert.ok(svg.includes(`>${product.name}<`));
      for (const chip of product.chips) assert.ok(svg.includes(`>${chip}<`), chip);
    }
  });

  test(`stack (${theme.name}) lists every group with themed tiles`, () => {
    const svg = renderStack(theme, icons);
    assertWellFormedXml(svg);
    for (const group of STACK) assert.ok(svg.includes(`>${group.label.replace('&', '&amp;')}<`), group.label);
    for (const chip of ['WooCommerce', 'Shopify', 'Playwright', 'OpenAI', 'Anthropic Claude', 'Google Gemini']) assert.ok(svg.includes(`>${chip}<`), chip);
    assert.ok(!svg.includes('#242938') && !svg.includes('#F4F2ED'), 'skillicons tiles are recoloured');
    assert.ok(svg.includes(`id="react-${theme.name}-a"`), 'ids are prefixed per icon');
  });

  test(`buttons (${theme.name}) size to their labels`, () => {
    const [primary, secondary] = BUTTONS.map((b) => renderButton(b, theme));
    for (const svg of [primary, secondary]) assertWellFormedXml(svg);
    assert.ok(primary.includes(`fill="${theme.buttonPrimary}"`));
    const width = (svg) => Number(svg.match(/width="(\d+)"/)[1]);
    assert.ok(width(primary) > width(secondary));
  });
}

test('retile swaps the skillicons tile colour', () => {
  assert.ok(retile(ICON('#242938'), '#123456').includes('<rect width="256" height="256" fill="#123456" rx="60"/>'));
});

test('renderStack fails loudly when an icon is missing', () => {
  assert.throws(() => renderStack(THEMES.dark, {}), /Missing icon/);
});

test('renderStaticAssets produces every README asset', () => {
  const files = renderStaticAssets({ icons, stafficMark });
  const expected = ['hero', 'card-developerlook', 'card-staffic', 'stack', 'btn-start', 'btn-email'].flatMap((n) => [`${n}-dark.svg`, `${n}-light.svg`]).sort();
  assert.deepEqual(Object.keys(files).sort(), expected);
});

test('every stack icon is vendored in both themes', async () => {
  for (const name of STACK_ICONS) for (const theme of ['dark', 'light']) await access(`assets/vendor/skillicons/${name}-${theme}.svg`);
  await access('assets/vendor/staffic-mark.svg');
});

test('retile handles either attribute order used by skillicons', () => {
  const rxFirst = '<svg viewBox="0 0 256 256"><rect width="256" height="256" rx="60" fill="#F4F2ED"/></svg>';
  assert.ok(retile(rxFirst, '#123456').includes('<rect width="256" height="256" rx="60" fill="#123456"/>'));
});

test('retile keeps brand-coloured tiles such as the JavaScript logo', () => {
  for (const js of [
    '<svg viewBox="0 0 256 256"><rect width="256" height="256" rx="60" fill="#F0DB4F"/></svg>',
    '<svg viewBox="0 0 256 256"><rect width="256" height="256" fill="#F0DB4F" rx="60"/></svg>',
  ]) {
    assert.equal(retile(js, '#123456'), js);
  }
});

test('retile treats the alternate light neutral (#F4F4ED) as a tile', () => {
  const actions = '<svg viewBox="0 0 256 256"><rect width="256" height="256" rx="60" fill="#F4F4ED"/></svg>';
  assert.ok(retile(actions, '#123456').includes('fill="#123456"'));
});
