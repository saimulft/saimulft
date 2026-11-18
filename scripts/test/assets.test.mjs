import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { BRAND, THEMES } from '../lib/theme.mjs';
import { renderHero } from '../lib/assets/hero.mjs';
import { EXPERIENCE, PRODUCTS, renderExperienceCard, renderProductCard } from '../lib/assets/cards.mjs';
import { numeral } from '../lib/assets/brand.mjs';
import { STACK, STACK_ICONS, renderStack, retile } from '../lib/assets/stack.mjs';
import { BUTTONS, renderButton } from '../lib/assets/buttons.mjs';
import { renderStaticAssets } from '../build-assets.mjs';
import { assertWellFormedXml } from './helpers.mjs';

const ICON = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 256 256"><g transform="translate(0, 0)"><svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="none" viewBox="0 0 256 256"><defs><linearGradient id="a"/></defs><rect width="256" height="256" fill="${fill}" rx="60"/><path fill="url(#a)" d="M0 0h9v9z"/></svg></g></svg>`;
const icons = Object.fromEntries(STACK_ICONS.flatMap((name) => [[`${name}-dark`, ICON('#242938')], [`${name}-light`, ICON('#F4F2ED')]]));
const count = (haystack, needle) => haystack.split(needle).length - 1;

for (const theme of Object.values(THEMES)) {
  test(`hero (${theme.name}) carries the name, roles, status and reduced-motion guard on the orange ground`, () => {
    const svg = renderHero(theme);
    assertWellFormedXml(svg);
    for (const value of ['Saimul Islam', 'FORWARD DEPLOYED ENGINEER · SOLUTIONS ARCHITECT', 'Open to Forward Deployed Engineer and Solutions Architect roles', 'prefers-reduced-motion', `fill="${BRAND.signal}"`]) {
      assert.ok(svg.includes(value), value);
    }
    // Every word on orange is white.
    for (const fill of svg.matchAll(/<text\b[^>]*fill="([^"]+)"/g)) assert.equal(fill[1], BRAND.white);
  });

  test(`product cards (${theme.name}) render name, copy and one lit fact`, () => {
    for (const product of PRODUCTS) {
      const svg = renderProductCard(product, theme);
      assertWellFormedXml(svg);
      assert.ok(svg.includes(`>${product.name}<`));
      for (const fact of product.facts) assert.ok(svg.includes(`>${fact.value}<`), fact.value);
      assert.equal(product.facts.filter((f) => f.lit).length, 1);
      assert.equal(count(svg, `stroke="${BRAND.signal}"`), 1, 'only the real result is filled');
    }
  });

  test(`experience card (${theme.name}) renders the practices and the lit result`, () => {
    const svg = renderExperienceCard(theme);
    assertWellFormedXml(svg);
    for (const value of ['>DeveloperLook<', `>${EXPERIENCE.fact.value}<`, ...EXPERIENCE.practices.map((p) => `>${p.toUpperCase()}<`)]) assert.ok(svg.includes(value), value);
    assert.equal(count(svg, `stroke="${BRAND.signal}"`), 1);
  });

  test(`stack (${theme.name}) lists every group with themed tiles`, () => {
    const svg = renderStack(theme, icons);
    assertWellFormedXml(svg);
    for (const group of STACK) assert.ok(svg.includes(`>${group.label.toUpperCase()}<`), group.label);
    for (const chip of ['Express', 'MongoDB', 'Socket.IO', 'Claude API', 'MCP', 'OpenAI', 'Google Gemini', 'OAuth', 'Stripe', 'Playwright']) assert.ok(svg.includes(`>${chip}<`), chip);
    assert.ok(!svg.includes('#242938') && !svg.includes('#F4F2ED'), 'skillicons tiles are recoloured');
    assert.ok(svg.includes(`id="react-${theme.name}-a"`), 'ids are prefixed per icon');
  });

  test(`buttons (${theme.name}): one orange main action, the rest line buttons`, () => {
    const [primary, ...rest] = BUTTONS.map((b) => renderButton(b, theme));
    for (const svg of [primary, ...rest]) assertWellFormedXml(svg);
    assert.ok(primary.includes(`fill="${theme.buttonPrimary}"`));
    for (const svg of rest) assert.ok(!svg.includes(theme.buttonPrimary));
    const width = (svg) => Number(svg.match(/width="(\d+)"/)[1]);
    for (const svg of [primary, ...rest]) assert.ok(width(svg) > 100);
  });
}

test('retile swaps the skillicons tile colour', () => {
  assert.ok(retile(ICON('#242938'), '#123456').includes('<rect width="256" height="256" fill="#123456" rx="60"/>'));
});

test('renderStack fails loudly when an icon is missing', () => {
  assert.throws(() => renderStack(THEMES.dark, {}), /Missing icon/);
});

test('renderStaticAssets produces every README asset', () => {
  const files = renderStaticAssets({ icons });
  const expected = ['hero', 'card-developerlook', 'card-staffic', 'card-bundlewise', 'stack', 'btn-email', 'btn-website', 'btn-linkedin'].flatMap((n) => [`${n}-dark.svg`, `${n}-light.svg`]).sort();
  assert.deepEqual(Object.keys(files).sort(), expected);
});

test('every stack icon is vendored in both themes', async () => {
  for (const name of STACK_ICONS) for (const theme of ['dark', 'light']) await access(`assets/vendor/skillicons/${name}-${theme}.svg`);
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

test('outline numerals refuse sizes below 48px', () => {
  assert.throws(() => numeral(0, 0, '16', { size: 32, ground: '#FFFFFF', theme: THEMES.light }), /48px/);
});

test('no asset uses the old purple or the Hypential #FF5C35', () => {
  const svgs = Object.values(renderStaticAssets({ icons })).join('');
  for (const old of ['#673DE6', '#FDC448', '#C98500', '#FF5C35']) assert.ok(!svgs.toUpperCase().includes(old), old);
});
