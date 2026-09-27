import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderAll } from '../generate.mjs';
import { sampleStats } from './helpers.mjs';

const README = await readFile('README.md', 'utf8');

test('every chart the README loads is produced by the generator or the snake step', () => {
  const produced = new Set([...Object.keys(renderAll(sampleStats())), 'snake-dark.svg', 'snake-light.svg']);
  const referenced = [...README.matchAll(/https:\/\/raw\.githubusercontent\.com\/saimulft\/saimulft\/output\/([\w.-]+)/g)].map((m) => m[1]);
  assert.equal(referenced.length, 10);
  for (const file of referenced) assert.ok(produced.has(file), file);
});

test('every static asset the README loads exists', async () => {
  const referenced = [...README.matchAll(/(?:src|srcset)="(assets\/[\w.-]+)"/g)].map((m) => m[1]);
  assert.equal(referenced.length, 12);
  for (const path of referenced) await readFile(path);
});

test('README follows the house rules and has dark variants and alt text', () => {
  assert.doesNotMatch(README, /[–—]/, 'no en or em dashes');
  for (const picture of README.split('<picture>').slice(1)) assert.match(picture, /prefers-color-scheme: dark/);
  for (const img of README.matchAll(/<img\b[^>]*>/g)) assert.match(img[0], /alt="[^"]+"/);
});
