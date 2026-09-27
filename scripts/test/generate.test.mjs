import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStats, main, renderAll, resolveTokens, summarizeCalendar } from '../generate.mjs';
import { renderStatsMarkdown } from '../lib/table.mjs';
import { consecutiveDays, sampleStats } from './helpers.mjs';

const NOW = new Date('2026-09-26T06:23:00Z');
const SECRET = 'zz-secret-client-alpha';
const WEEK = consecutiveDays('2026-09-20', [1, 2, 0, 3, 4, 5, 6]);

function calendarPayload(days, createdAt) {
  return {
    user: {
      ...(createdAt ? { createdAt } : {}),
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: days.reduce((s, d) => s + d.count, 0),
          weeks: [{ contributionDays: days.map((d) => ({ date: d.date, contributionCount: d.count })) }],
        },
      },
    },
  };
}

function fakeCalendarGitHub() {
  return {
    async graphql(query, { from }) {
      return calendarPayload(WEEK, from ? undefined : '2026-01-05T00:00:00Z');
    },
  };
}

function fakeCodeGitHub() {
  return {
    async restAll() {
      return [{ full_name: `acme/${SECRET}`, fork: false }];
    },
    async rest(path) {
      if (path.endsWith('/languages')) return { status: 200, data: { TypeScript: 700, JavaScript: 300 }, next: null };
      return { status: 200, data: [{ login: 'saimulft', contributions: 9 }, { login: 'teammate', contributions: 1 }], next: null };
    },
  };
}

function fakeFetch() {
  const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  return async (url, init = {}) => {
    const u = String(url);
    if (u === 'https://api.github.com/graphql') {
      const { variables } = JSON.parse(init.body);
      return reply({ data: calendarPayload(WEEK, variables.from ? undefined : '2026-01-05T00:00:00Z') });
    }
    if (u.startsWith('https://api.github.com/user/repos')) {
      return reply([{ full_name: `acme/${SECRET}`, fork: false }, { full_name: 'acme/zz-secret-client-beta', fork: false }]);
    }
    if (u.endsWith('/languages')) return reply({ TypeScript: 10 });
    if (u.includes('zz-secret-client-beta')) return reply({ message: 'Forbidden' }, 403);
    return reply([{ login: 'saimulft', contributions: 3 }]);
  };
}

test('summarizeCalendar derives every calendar metric', () => {
  const summary = summarizeCalendar(
    { createdAt: '2019-09-30T06:03:07Z', lastYear: { total: 21, days: WEEK }, years: [{ year: 2025, total: 100 }, { year: 2026, total: 21 }], allDays: WEEK },
    NOW,
  );
  assert.equal(summary.since, '2019-09-30');
  assert.equal(summary.lastYearTotal, 21);
  assert.equal(summary.allTimeTotal, 121);
  assert.equal(summary.activeDaysLastYear, 6);
  assert.deepEqual(summary.currentStreak, { days: 4, start: '2026-09-23', end: '2026-09-26' });
  assert.equal(summary.longestStreak.days, 4);
  assert.deepEqual(summary.busiestDay, { date: '2026-09-26', count: 6 });
  assert.equal(summary.months.at(-1).count, 21);
  assert.equal(summary.weekdays.find((d) => d.day === 'Sat').count, 6);
});

test('buildStats combines calendar and code stats', async () => {
  const logs = [];
  const stats = await buildStats({ login: 'saimulft', calendarGh: fakeCalendarGitHub(), codeGh: fakeCodeGitHub(), now: NOW, log: (m) => logs.push(m) });
  assert.equal(stats.schemaVersion, 1);
  assert.equal(stats.calendar.lastYearTotal, 21);
  assert.equal(stats.code.reposContributed, 1);
  assert.deepEqual(stats.code.languages, [{ name: 'TypeScript', percent: 70 }, { name: 'JavaScript', percent: 30 }]);
  assert.ok(logs.some((m) => m.startsWith('code: 1 of 1 repositories')));
});

test('without a code token the previous code snapshot is reused', async () => {
  const previous = sampleStats();
  const stats = await buildStats({ login: 'saimulft', calendarGh: fakeCalendarGitHub(), codeGh: null, previous, now: NOW, log: () => {} });
  assert.deepEqual(stats.code, previous.code);
});

test('a suspiciously small fresh snapshot keeps the previous one', async () => {
  const previous = sampleStats();
  const logs = [];
  const stats = await buildStats({ login: 'saimulft', calendarGh: fakeCalendarGitHub(), codeGh: fakeCodeGitHub(), previous, now: NOW, log: (m) => logs.push(m) });
  assert.deepEqual(stats.code, previous.code);
  assert.ok(logs.some((m) => m.startsWith('warning:')));
});

test('resolveTokens never uses the Actions token for private code stats', () => {
  assert.deepEqual(resolveTokens({ CI: 'true', GITHUB_TOKEN: 'actions' }, () => 'cli'), { calendarToken: 'actions', codeToken: undefined });
  assert.deepEqual(resolveTokens({ CI: 'true', GITHUB_TOKEN: 'actions', PROFILE_STATS_TOKEN: 'pat' }, () => 'cli'), { calendarToken: 'actions', codeToken: 'pat' });
  assert.deepEqual(resolveTokens({}, () => 'cli'), { calendarToken: 'cli', codeToken: 'cli' });
});

test('renderAll writes both themes of every chart plus the data files', () => {
  const files = renderAll(sampleStats());
  assert.deepEqual(Object.keys(files).sort(), [
    'activity-dark.svg', 'activity-light.svg', 'languages-dark.svg', 'languages-light.svg',
    'overview-dark.svg', 'overview-light.svg', 'rhythm-dark.svg', 'rhythm-light.svg', 'stats.json', 'stats.md',
  ]);
  assert.equal(JSON.parse(files['stats.json']).code.reposContributed, 69);
});

test('renderStatsMarkdown mirrors the charts as tables', () => {
  const md = renderStatsMarkdown(sampleStats());
  for (const value of ['| Contributions, last 12 months | 1,450 |', '| Mar 2026 | 306 |', '| Fri | 243 |', '| TypeScript | 41.1% |']) {
    assert.ok(md.includes(value), value);
  }
  assert.doesNotMatch(md, /[–—]/);
  assert.ok(renderStatsMarkdown(sampleStats({ code: null })).includes('Not available yet.'));
});

test('main writes charts to disk without leaking repository names', async () => {
  const out = await mkdtemp(join(tmpdir(), 'profile-stats-'));
  const logs = [];
  const code = await main(['--out', out, '--login', 'saimulft'], {}, { fetchImpl: fakeFetch(), ghToken: () => 'local-token', log: (m) => logs.push(m), now: NOW });
  assert.equal(code, 0);
  const names = await readdir(out);
  assert.equal(names.length, 10);
  const contents = await Promise.all(names.map((n) => readFile(join(out, n), 'utf8')));
  assert.doesNotMatch([...logs, ...contents].join('\n'), /zz-secret|acme/);
  assert.ok(logs.some((m) => m.includes('1 skipped')));
});

test('main reports a clear error when no token is available', async () => {
  const logs = [];
  const code = await main(['--out', 'unused'], { CI: 'true' }, { ghToken: () => undefined, log: (m) => logs.push(m) });
  assert.equal(code, 1);
  assert.match(logs.join('\n'), /No GitHub token found/);
});

test('main ignores a corrupt previous snapshot', async () => {
  const out = await mkdtemp(join(tmpdir(), 'profile-stats-'));
  const previous = join(out, 'previous.json');
  await writeFile(previous, '{not json');
  const code = await main(['--out', out, '--previous', previous], { CI: 'true', GITHUB_TOKEN: 'actions' }, { fetchImpl: fakeFetch(), log: () => {}, now: NOW });
  assert.equal(code, 0);
  const stats = JSON.parse(await readFile(join(out, 'stats.json'), 'utf8'));
  assert.equal(stats.code, null);
});

test('an expired private-access token keeps the previous snapshot and still writes charts', async () => {
  const out = await mkdtemp(join(tmpdir(), 'profile-stats-'));
  const previousPath = join(out, 'previous.json');
  await writeFile(previousPath, JSON.stringify(sampleStats()));
  const healthy = fakeFetch();
  const expired = async (url, init) =>
    String(url).startsWith('https://api.github.com/user/repos')
      ? new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401, headers: { 'content-type': 'application/json' } })
      : healthy(url, init);
  const logs = [];
  const env = { CI: 'true', GITHUB_TOKEN: 'actions', PROFILE_STATS_TOKEN: 'expired' };
  const code = await main(['--out', out, '--previous', previousPath], env, { fetchImpl: expired, log: (m) => logs.push(m), now: NOW });
  assert.equal(code, 0);
  const stats = JSON.parse(await readFile(join(out, 'stats.json'), 'utf8'));
  assert.deepEqual(stats.code, sampleStats().code);
  assert.ok(logs.some((m) => m.startsWith('warning: code stats unavailable')), logs.join('\n'));
});

test('a hand-edited previous snapshot with a broken code block is ignored, not trusted', async () => {
  const breakages = [
    (code) => delete code.excluded,
    (code) => (code.languages[0].percent = '41.1'),
    (code) => delete code.reposContributed,
    (code) => Object.keys(code).forEach((key) => delete code[key]),
  ];
  for (const breakIt of breakages) {
    const out = await mkdtemp(join(tmpdir(), 'profile-stats-'));
    const previousPath = join(out, 'previous.json');
    const previous = sampleStats();
    breakIt(previous.code);
    await writeFile(previousPath, JSON.stringify(previous));
    const code = await main(['--out', out, '--previous', previousPath], { CI: 'true', GITHUB_TOKEN: 'actions' }, { fetchImpl: fakeFetch(), log: () => {}, now: NOW });
    assert.equal(code, 0, breakIt.toString());
    const stats = JSON.parse(await readFile(join(out, 'stats.json'), 'utf8'));
    assert.equal(stats.code, null, breakIt.toString());
    assert.ok(!(await readFile(join(out, 'overview-dark.svg'), 'utf8')).includes('NaN'), breakIt.toString());
  }
});
