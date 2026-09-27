import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { createGitHub } from './lib/github.mjs';
import { collectCalendar, collectCode } from './lib/collect.mjs';
import { DEFAULT_EXCLUDED_LANGUAGES, activeDays, busiestDay, languageMix, monthlySeries, streaks, weekdayTotals } from './lib/metrics.mjs';
import { toISODate } from './lib/dates.mjs';
import { THEMES } from './lib/theme.mjs';
import { renderOverview } from './lib/charts/overview.mjs';
import { renderActivity } from './lib/charts/activity.mjs';
import { renderLanguages } from './lib/charts/languages.mjs';
import { renderRhythm } from './lib/charts/rhythm.mjs';
import { renderStatsMarkdown } from './lib/table.mjs';

const CHARTS = { overview: renderOverview, activity: renderActivity, languages: renderLanguages, rhythm: renderRhythm };

export function summarizeCalendar(calendar, now) {
  const today = toISODate(now);
  const { current, longest } = streaks(calendar.allDays, today);
  return {
    since: calendar.createdAt.slice(0, 10),
    lastYearTotal: calendar.lastYear.total,
    allTimeTotal: calendar.years.reduce((sum, y) => sum + y.total, 0),
    activeDaysLastYear: activeDays(calendar.lastYear.days),
    currentStreak: current,
    longestStreak: longest,
    busiestDay: busiestDay(calendar.lastYear.days),
    months: monthlySeries(calendar.allDays, today, 12),
    weekdays: weekdayTotals(calendar.lastYear.days),
  };
}

export function summarizeCode(code, now) {
  return {
    updatedAt: now.toISOString(),
    reposContributed: code.reposContributed,
    commits: code.commits,
    languages: languageMix(code.repos),
    excluded: DEFAULT_EXCLUDED_LANGUAGES,
  };
}

// Logs carry counts only: GitHub Actions logs on a public repository are public.
export async function buildStats({ login, calendarGh, codeGh, previous = null, now = new Date(), log = () => {} }) {
  const calendar = summarizeCalendar(await collectCalendar(calendarGh, login, { now }), now);
  log(`calendar: ${calendar.lastYearTotal} contributions in the last year, ${calendar.allTimeTotal} all-time`);
  let code = previous?.code ?? null;
  if (codeGh) {
    // An expired or under-scoped token must not stop the calendar charts from refreshing.
    // Error messages from the client never contain request paths, so they are safe to log.
    let raw = null;
    try {
      raw = await collectCode(codeGh, login);
    } catch (error) {
      log(`warning: code stats unavailable (${error.message}); ${code ? 'keeping the previous snapshot' : 'no previous snapshot to keep'}`);
    }
    if (raw) {
      log(`code: ${raw.reposContributed} of ${raw.reposScanned} repositories have my commits (${raw.skipped} skipped, ${raw.empty} empty)`);
      const fresh = summarizeCode(raw, now);
      const floor = (previous?.code?.reposContributed ?? 0) / 2;
      if (fresh.reposContributed < floor) {
        log(`warning: fresh code stats cover ${fresh.reposContributed} repositories, fewer than half of the previous ${previous.code.reposContributed}; keeping the previous snapshot`);
      } else {
        code = fresh;
      }
    }
  } else {
    log(code ? 'code: no private-access token, reusing the previous snapshot' : 'code: no private-access token and no previous snapshot');
  }
  return { schemaVersion: 1, generatedAt: now.toISOString(), login, calendar, code };
}

export function renderAll(stats) {
  const files = {};
  for (const [name, render] of Object.entries(CHARTS)) {
    for (const theme of Object.values(THEMES)) files[`${name}-${theme.name}.svg`] = render(stats, theme);
  }
  files['stats.json'] = `${JSON.stringify(stats, null, 2)}\n`;
  files['stats.md'] = renderStatsMarkdown(stats);
  return files;
}

export function ghCliToken() {
  const result = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() || undefined : undefined;
}

// The built-in Actions token cannot read private repositories, so it is never used for code stats.
export function resolveTokens(env, ghToken = ghCliToken) {
  let cached;
  const cli = () => (env.CI ? undefined : (cached ??= ghToken()));
  return {
    calendarToken: env.GITHUB_TOKEN || env.PROFILE_STATS_TOKEN || cli(),
    codeToken: env.PROFILE_STATS_TOKEN || cli(),
  };
}

const isCount = (n) => Number.isFinite(n) && n >= 0;

// The snapshot lives on a public branch and can be edited by hand; reuse its code block only when it is intact.
export function validCode(code) {
  const intact =
    code !== null &&
    typeof code === 'object' &&
    isCount(code.reposContributed) &&
    isCount(code.commits) &&
    Array.isArray(code.languages) &&
    code.languages.every((l) => l !== null && typeof l === 'object' && typeof l.name === 'string' && Number.isFinite(l.percent)) &&
    Array.isArray(code.excluded) &&
    code.excluded.every((name) => typeof name === 'string');
  return intact ? code : null;
}

async function readPrevious(path) {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    return parsed?.schemaVersion === 1 ? { ...parsed, code: validCode(parsed.code) } : null;
  } catch {
    return null;
  }
}

export async function main(argv = process.argv.slice(2), env = process.env, deps = {}) {
  const { fetchImpl = globalThis.fetch, ghToken = ghCliToken, log = (m) => console.log(`profile-stats: ${m}`), now = new Date() } = deps;
  try {
    const { values } = parseArgs({
      args: argv,
      options: { out: { type: 'string', default: 'dist' }, previous: { type: 'string' }, login: { type: 'string' } },
    });
    const login = values.login ?? env.GITHUB_REPOSITORY_OWNER ?? 'saimulft';
    const { calendarToken, codeToken } = resolveTokens(env, ghToken);
    if (!calendarToken) throw new Error('No GitHub token found. Set GITHUB_TOKEN or sign in with `gh auth login`.');
    const previous = values.previous ? await readPrevious(values.previous) : null;
    const stats = await buildStats({
      login,
      calendarGh: createGitHub({ token: calendarToken, fetchImpl }),
      codeGh: codeToken ? createGitHub({ token: codeToken, fetchImpl }) : null,
      previous,
      now,
      log,
    });
    const files = renderAll(stats);
    await mkdir(values.out, { recursive: true });
    for (const [name, content] of Object.entries(files)) await writeFile(join(values.out, name), content);
    log(`wrote ${Object.keys(files).length} files to ${values.out}`);
    return 0;
  } catch (error) {
    log(`error: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
