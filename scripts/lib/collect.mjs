import { normalizeDays } from './metrics.mjs';

const CALENDAR_FIELDS = 'contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }';
const PROFILE_WINDOW_QUERY = `query($login: String!) { user(login: $login) { createdAt contributionsCollection { ${CALENDAR_FIELDS} } } }`;
const RANGE_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { contributionsCollection(from: $from, to: $to) { ${CALENDAR_FIELDS} } } }`;
const REPOS_PATH = 'user/repos?per_page=100&affiliation=owner,collaborator,organization_member';

function calendarDays(calendar) {
  return calendar.weeks.flatMap((week) => week.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
}

// Public data: works with any token because private contribution counts are public on the profile.
export async function collectCalendar(gh, login, { now = new Date() } = {}) {
  const profile = await gh.graphql(PROFILE_WINDOW_QUERY, { login });
  if (!profile?.user) throw new Error('GitHub user not found');
  const { createdAt } = profile.user;
  const recent = profile.user.contributionsCollection.contributionCalendar;
  const years = [];
  let allDays = [];
  const firstYear = new Date(createdAt).getUTCFullYear();
  const thisYear = now.getUTCFullYear();
  for (let year = firstYear; year <= thisYear; year += 1) {
    const from = year === firstYear ? createdAt : `${year}-01-01T00:00:00Z`;
    const to = year === thisYear ? now.toISOString() : `${year}-12-31T23:59:59Z`;
    const data = await gh.graphql(RANGE_QUERY, { login, from, to });
    const calendar = data.user.contributionsCollection.contributionCalendar;
    const [fromDay, toDay] = [from.slice(0, 10), to.slice(0, 10)];
    years.push({ year, total: calendar.totalContributions });
    allDays = allDays.concat(calendarDays(calendar).filter((d) => d.date >= fromDay && d.date <= toDay));
  }
  return {
    createdAt,
    lastYear: { total: recent.totalContributions, days: normalizeDays(calendarDays(recent)) },
    years,
    allDays: normalizeDays(allDays),
  };
}

export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// Needs a token that can read private repositories. Returns aggregates only:
// repository names are used for requests and are never returned or logged.
export async function collectCode(gh, login, { concurrency = 6 } = {}) {
  const repos = (await gh.restAll(REPOS_PATH)).filter((repo) => !repo.fork);
  const me = login.toLowerCase();
  let skipped = 0;
  let empty = 0;
  const rows = await mapLimit(repos, concurrency, async (repo) => {
    const first = await gh.rest(`repos/${repo.full_name}/contributors?per_page=100&anon=1`);
    if (first.status === 204) {
      empty += 1;
      return null;
    }
    if (first.status !== 200 || !Array.isArray(first.data)) {
      skipped += 1;
      return null;
    }
    let contributors = first.data;
    for (let url = first.next; url; ) {
      const page = await gh.rest(url);
      if (page.status !== 200 || !Array.isArray(page.data)) break;
      contributors = contributors.concat(page.data);
      url = page.next;
    }
    const mine = contributors.find((c) => c.login?.toLowerCase() === me)?.contributions ?? 0;
    const total = contributors.reduce((sum, c) => sum + (c.contributions ?? 0), 0);
    if (mine === 0) return null;
    const languages = await gh.rest(`repos/${repo.full_name}/languages`);
    return { mine, total, languages: languages.status === 200 && languages.data ? languages.data : {} };
  });
  const contributed = rows.filter(Boolean);
  return {
    reposScanned: repos.length,
    reposContributed: contributed.length,
    commits: contributed.reduce((sum, row) => sum + row.mine, 0),
    repos: contributed,
    skipped,
    empty,
  };
}
