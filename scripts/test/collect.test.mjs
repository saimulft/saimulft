import test from 'node:test';
import assert from 'node:assert/strict';
import { collectCalendar, collectCode, mapLimit } from '../lib/collect.mjs';

function calendar(days) {
  return {
    contributionCalendar: {
      totalContributions: days.reduce((s, d) => s + d.count, 0),
      weeks: [{ contributionDays: days.map((d) => ({ date: d.date, contributionCount: d.count })) }],
    },
  };
}

test('collectCalendar reads the profile window and every year since the account was created', async () => {
  const calls = [];
  const gh = {
    async graphql(query, variables) {
      calls.push(variables);
      if (!variables.from) {
        return { user: { createdAt: '2025-06-15T10:00:00Z', contributionsCollection: calendar([{ date: '2026-02-09', count: 2 }, { date: '2026-02-10', count: 1 }]) } };
      }
      if (variables.from.startsWith('2025')) {
        return { user: { contributionsCollection: calendar([{ date: '2025-06-14', count: 0 }, { date: '2025-06-15', count: 4 }, { date: '2025-12-31', count: 1 }]) } };
      }
      return { user: { contributionsCollection: calendar([{ date: '2026-02-09', count: 2 }, { date: '2026-02-10', count: 1 }]) } };
    },
  };
  const result = await collectCalendar(gh, 'saimulft', { now: new Date('2026-02-10T12:00:00Z') });
  assert.equal(result.createdAt, '2025-06-15T10:00:00Z');
  assert.deepEqual(calls.map((v) => [v.from, v.to]), [
    [undefined, undefined],
    ['2025-06-15T10:00:00Z', '2025-12-31T23:59:59Z'],
    ['2026-01-01T00:00:00Z', '2026-02-10T12:00:00.000Z'],
  ]);
  assert.equal(result.lastYear.total, 3);
  assert.deepEqual(result.years, [{ year: 2025, total: 5 }, { year: 2026, total: 3 }]);
  assert.deepEqual(result.allDays.map((d) => d.date), ['2025-06-15', '2025-12-31', '2026-02-09', '2026-02-10']);
});

test('collectCalendar fails clearly for an unknown user', async () => {
  const gh = { async graphql() { return { user: null }; } };
  await assert.rejects(collectCalendar(gh, 'nobody'), /GitHub user not found/);
});

test('collectCode returns aggregates for repos I committed to and never repo names', async () => {
  const requested = [];
  const responses = {
    'repos/acme/secret-one/contributors?per_page=100&anon=1': { status: 200, data: [{ login: 'SaimulFT', contributions: 8 }, { login: 'teammate', contributions: 2 }], next: null },
    'repos/acme/secret-one/languages': { status: 200, data: { TypeScript: 1000 }, next: null },
    'repos/acme/empty/contributors?per_page=100&anon=1': { status: 204, data: null, next: null },
    'repos/acme/not-mine/contributors?per_page=100&anon=1': { status: 200, data: [{ login: 'teammate', contributions: 5 }], next: null },
    'repos/acme/no-access/contributors?per_page=100&anon=1': { status: 403, data: { message: 'Forbidden' }, next: null },
  };
  const gh = {
    async restAll(path) {
      assert.equal(path, 'user/repos?per_page=100&affiliation=owner,collaborator,organization_member');
      return ['secret-one', 'forked', 'empty', 'not-mine', 'no-access'].map((name) => ({ full_name: `acme/${name}`, fork: name === 'forked' }));
    },
    async rest(path) {
      requested.push(path);
      return responses[path] ?? { status: 404, data: null, next: null };
    },
  };
  const code = await collectCode(gh, 'saimulft');
  assert.deepEqual(code, {
    reposScanned: 4,
    reposContributed: 1,
    commits: 8,
    repos: [{ mine: 8, total: 10, languages: { TypeScript: 1000 } }],
    skipped: 1,
    empty: 1,
  });
  assert.ok(!requested.some((p) => p.includes('forked')));
  assert.ok(!requested.includes('repos/acme/not-mine/languages'));
  assert.doesNotMatch(JSON.stringify(code), /acme|secret/);
});

test('collectCode follows contributor pagination', async () => {
  const gh = {
    async restAll() {
      return [{ full_name: 'acme/big', fork: false }];
    },
    async rest(path) {
      if (path === 'repos/acme/big/contributors?per_page=100&anon=1') {
        return { status: 200, data: [{ login: 'teammate', contributions: 90 }], next: 'https://api.github.com/repositories/1/contributors?page=2' };
      }
      if (path === 'https://api.github.com/repositories/1/contributors?page=2') {
        return { status: 200, data: [{ login: 'saimulft', contributions: 10 }], next: null };
      }
      return { status: 200, data: { Go: 50 }, next: null };
    },
  };
  const code = await collectCode(gh, 'saimulft');
  assert.deepEqual(code.repos, [{ mine: 10, total: 100, languages: { Go: 50 } }]);
});

test('mapLimit runs work with bounded concurrency and keeps order', async () => {
  let active = 0;
  let peak = 0;
  const out = await mapLimit([1, 2, 3, 4, 5], 2, async (n) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((done) => setTimeout(done, 5));
    active -= 1;
    return n * 10;
  });
  assert.deepEqual(out, [10, 20, 30, 40, 50]);
  assert.equal(peak, 2);
});
