import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../lib/theme.mjs';
import { attrs, cardRect, columnPath, contrastRatio, el, esc, fmt, nestSvg, niceScale, plural, prefixIds, rowPath, svgDoc, text, textWidth, truncate } from '../lib/svg.mjs';
import { assertWellFormedXml } from './helpers.mjs';

test('esc escapes XML special characters', () => {
  assert.equal(esc(`a & b < c > d "e" 'f'`), 'a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;');
});

test('fmt and plural format whole numbers with thousands separators', () => {
  assert.equal(fmt(1450), '1,450');
  assert.equal(fmt(1450.6), '1,451');
  assert.equal(plural(1, 'day'), '1 day');
  assert.equal(plural(14, 'day'), '14 days');
});

test('el builds self-closing and nested elements and skips empty attributes', () => {
  assert.equal(el('rect', { x: 1.234, y: undefined, fill: '#fff' }), '<rect x="1.23" fill="#fff"/>');
  assert.equal(el('g', {}, '<a/>', ['<b/>']), '<g><a/><b/></g>');
  assert.equal(attrs({ hidden: false, title: 'A & B' }), ' title="A &amp; B"');
  assert.equal(text(1, 2, 'x < y', { size: 12 }), '<text x="1" y="2" font-size="12">x &lt; y</text>');
});

test('niceScale picks round ticks that cover the data', () => {
  assert.deepEqual(niceScale(306), { max: 400, ticks: [0, 100, 200, 300, 400] });
  assert.deepEqual(niceScale(243, 3), { max: 300, ticks: [0, 100, 200, 300] });
  assert.deepEqual(niceScale(3), { max: 3, ticks: [0, 1, 2, 3] });
  assert.deepEqual(niceScale(0), { max: 4, ticks: [0, 1, 2, 3, 4] });
});

test('bar paths round the data end and stay square at the baseline', () => {
  assert.equal(columnPath(10, 100, 24, 0), '');
  assert.equal(columnPath(10, 100, 24, 50), 'M10 100V54Q10 50 14 50H30Q34 50 34 54V100Z');
  assert.equal(columnPath(10, 100, 24, 2), 'M10 100V100Q10 98 12 98H32Q34 98 34 100V100Z');
  assert.equal(rowPath(0, 20, 100, 14), 'M0 13H96Q100 13 100 17V23Q100 27 96 27H0Z');
});

test('contrastRatio matches WCAG reference values', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#FFFFFF') * 10) / 10, 21);
  assert.equal(contrastRatio('#673DE6', '#673DE6'), 1);
});

for (const theme of Object.values(THEMES)) {
  test(`${theme.name} theme text passes 4.5:1 and marks pass 3:1 on the card surface`, () => {
    for (const key of ['text', 'textSecondary', 'textMuted', 'link', 'eyebrow']) {
      const ratio = contrastRatio(theme[key], theme.surface);
      assert.ok(ratio >= 4.5, `${key} ${ratio.toFixed(2)}`);
    }
    for (const key of ['series', 'highlight']) {
      const ratio = contrastRatio(theme[key], theme.surface);
      assert.ok(ratio >= 3, `${key} ${ratio.toFixed(2)}`);
    }
  });
}

test('textWidth and truncate keep labels inside their column', () => {
  assert.ok(textWidth('TypeScript', 13) > textWidth('PHP', 13));
  assert.equal(truncate('PHP', 90, 13), 'PHP');
  const cut = truncate('Jupyter Notebook Extended', 90, 13);
  assert.ok(cut.endsWith('…'));
  assert.ok(textWidth(cut, 13) <= 90);
});

test('svgDoc wraps a body with accessible title, description and reduced-motion guard', () => {
  const doc = svgDoc({ width: 100, height: 50, title: 'Weekly rhythm', desc: 'Mon 1 & Tue 2', body: cardRect(100, 50, THEMES.dark) });
  assertWellFormedXml(doc);
  assert.match(doc, /<title id="weekly-rhythm-title">Weekly rhythm<\/title>/);
  assert.match(doc, /Mon 1 &amp; Tue 2/);
  assert.match(doc, /prefers-reduced-motion/);
  assert.match(doc, /fill="#110C1E"/);
});

test('prefixIds and nestSvg embed third-party SVGs without id collisions', () => {
  const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient id="a"/></defs><path fill="url(#a)" d="M0 0h1v1z"/><use href="#a"/></svg>';
  assert.equal(
    prefixIds('<g id="a"><path fill="url(#a)"/><use xlink:href="#a"/></g>', 'x'),
    '<g id="x-a"><path fill="url(#x-a)"/><use xlink:href="#x-a"/></g>',
  );
  const nested = nestSvg(icon, { x: 10, y: 20, width: 44, height: 44, prefix: 'react-dark' });
  assertWellFormedXml(nested);
  assert.match(nested, /^<svg x="10" y="20" width="44" height="44" viewBox="0 0 256 256">/);
  assert.match(nested, /id="react-dark-a"/);
  assert.match(nested, /url\(#react-dark-a\)/);
  assert.match(nested, /href="#react-dark-a"/);
});
