const API = 'https://api.github.com';
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export function nextLink(header) {
  if (!header) return null;
  for (const part of header.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

// Error messages never include request paths: those contain private repository names.
export function createGitHub({ token, fetchImpl = globalThis.fetch, sleep = (ms) => new Promise((done) => setTimeout(done, ms)), retries = 3 } = {}) {
  if (!token) throw new Error('A GitHub token is required');
  const baseHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'saimulft-profile-stats',
  };

  async function request(url, init = {}) {
    for (let attempt = 0; ; attempt += 1) {
      let response;
      try {
        response = await fetchImpl(url, { ...init, headers: { ...baseHeaders, ...init.headers } });
      } catch (error) {
        if (attempt >= retries) throw new Error(`Network error while calling GitHub (${error.code ?? error.name})`);
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      const retryAfter = Number(response.headers.get('retry-after'));
      const rateLimited = response.status === 403 && retryAfter > 0;
      if ((RETRYABLE.has(response.status) || rateLimited) && attempt < retries) {
        await sleep(retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
        continue;
      }
      return response;
    }
  }

  async function graphql(query, variables = {}) {
    const response = await request(`${API}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) throw new Error(`GitHub GraphQL request failed with status ${response.status}`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(`GitHub GraphQL error: ${payload.errors.map((e) => e.message).join('; ')}`);
    return payload.data;
  }

  async function rest(path) {
    const response = await request(path.startsWith('https://') ? path : `${API}/${path}`);
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    return { status: response.status, data, next: nextLink(response.headers.get('link')) };
  }

  async function restAll(path) {
    const items = [];
    for (let url = path; url; ) {
      const page = await rest(url);
      if (page.status >= 400) throw new Error(`GitHub REST request failed with status ${page.status}`);
      if (Array.isArray(page.data)) items.push(...page.data);
      url = page.next;
    }
    return items;
  }

  return { graphql, rest, restAll };
}
