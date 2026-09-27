import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../lib/theme.mjs';
import { renderOverview } from '../lib/charts/overview.mjs';
import { renderActivity } from '../lib/charts/activity.mjs';
import { renderLanguages } from '../lib/charts/languages.mjs';
import { renderRhythm } from '../lib/charts/rhythm.mjs';
import { assertWellFormedXml, sampleStats } from './helpers.mjs';

const RENDERERS = { renderOverview, renderActivity, renderLanguages, renderRhythm };
const count = (haystack, needle) => haystack.split(needle).length - 1;

for (const [name, render] of Object.entries(RENDERERS)) {
  for (const theme of Object.values(THEMES)) {
    test(`${name} (${theme.name}) is well-formed and accessible`, () => {
      const svg = render(sampleStats(), theme);
      assertWellFormedXml(svg);
      assert.match(svg, /<title id="[^"]+">[^<]+<\/title><desc id="[^"]+">[^<]+<\/desc>/);
      assert.ok(svg.includes(`fill="${theme.surface}"`));
      assert.doesNotMatch(svg, /[–—]/);
    });
  }
}

test('overview shows the headline numbers', () => {
  const svg = renderOverview(sampleStats(), THEMES.dark);
  for (const value of ['>1,450<', '>1,513<', '>69<', '>197<', '>13<', '>days<', 'Since Sep 2019', 'Longest 14 days']) {
    assert.ok(svg.includes(value), value);
  }
});

test('overview shows n/a when code stats are missing', () => {
  assert.ok(renderOverview(sampleStats({ code: null }), THEMES.light).includes('>n/a<'));
});

test('activity highlights only the peak month and labels the current month', () => {
  const theme = THEMES.dark;
  const svg = renderActivity(sampleStats(), theme);
  assert.equal(count(svg, `fill="${theme.highlight}"`), 1);
  for (const value of ['Contributions per month', 'Updated Sep 26, 2026', 'peak in March', '>306<', '>261<', '>to date<', '>2025<', '>2026<']) {
    assert.ok(svg.includes(value), value);
  }
});

test('activity with no contributions renders without a highlight', () => {
  const stats = sampleStats();
  stats.calendar.months = stats.calendar.months.map((m) => ({ ...m, count: 0 }));
  const svg = renderActivity(stats, THEMES.light);
  assertWellFormedXml(svg);
  assert.equal(count(svg, `fill="${THEMES.light.highlight}"`), 0);
  assert.ok(!svg.includes('peak in'));
});

test('languages ranks bars, highlights the top language and escapes names', () => {
  const stats = sampleStats();
  stats.code.languages = [
    { name: 'C++ & <Templates>', percent: 60 },
    { name: 'Jupyter Notebook Extended', percent: 30 },
    { name: 'Other', percent: 10 },
  ];
  const theme = THEMES.dark;
  const svg = renderLanguages(stats, theme);
  assertWellFormedXml(svg);
  assert.ok(svg.includes('C++ &amp; &lt;Templates&gt;'));
  assert.ok(svg.includes('…'));
  assert.equal(count(svg, `fill="${theme.highlight}"`), 1);
  assert.equal(count(svg, `fill="${theme.other}"`), 1);
  assert.ok(svg.includes('>60.0%<'));
});

test('languages shows an empty state without code stats', () => {
  const svg = renderLanguages(sampleStats({ code: null }), THEMES.light);
  assertWellFormedXml(svg);
  assert.ok(svg.includes('Language data is not available yet'));
});

test('rhythm highlights the busiest weekday', () => {
  const theme = THEMES.light;
  const svg = renderRhythm(sampleStats(), theme);
  assert.equal(count(svg, `fill="${theme.highlight}"`), 1);
  assert.ok(svg.includes('Busiest day: Friday'));
  assert.ok(svg.includes('>243<'));
});
