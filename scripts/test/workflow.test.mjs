import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const WORKFLOW = await readFile('.github/workflows/profile-stats.yml', 'utf8');

test('the workflow re-enables its own schedule so GitHub never disables it for inactivity', () => {
  assert.match(WORKFLOW, /^ {2}actions: write$/m);
  assert.match(WORKFLOW, /gh api --method PUT "repos\/\$\{GITHUB_REPOSITORY\}\/actions\/workflows\/profile-stats\.yml\/enable"/);
});
