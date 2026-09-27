import test from 'node:test';
import assert from 'node:assert/strict';
import { createGitHub, nextLink } from '../lib/github.mjs';

function json(body, status = 200, headers = {}) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

function scriptedFetch(responses) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  };
  return { fetchImpl, calls };
}

const noSleep = async () => {};

test('nextLink reads the rel="next" URL from a Link header', () => {
  assert.equal(
    nextLink('<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=5>; rel="last"'),
    'https://api.github.com/x?page=2',
  );
  assert.equal(nextLink('<https://api.github.com/x?page=5>; rel="last"'), null);
  assert.equal(nextLink(null), null);
});

test('graphql posts the query with the bearer token and returns data', async () => {
  const { fetchImpl, calls } = scriptedFetch([json({ data: { viewer: { login: 'saimulft' } } })]);
  const gh = createGitHub({ token: 't0ken', fetchImpl, sleep: noSleep });
  assert.deepEqual(await gh.graphql('query { viewer { login } }'), { viewer: { login: 'saimulft' } });
  assert.equal(calls[0].url, 'https://api.github.com/graphql');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer t0ken');
});

test('transient failures are retried with backoff', async () => {
  const waits = [];
  const { fetchImpl, calls } = scriptedFetch([json({}, 502), new TypeError('fetch failed'), json({ data: { ok: true } })]);
  const gh = createGitHub({ token: 't', fetchImpl, sleep: async (ms) => waits.push(ms) });
  assert.deepEqual(await gh.graphql('query { ok }'), { ok: true });
  assert.equal(calls.length, 3);
  assert.deepEqual(waits, [1000, 2000]);
});

test('secondary rate limits honour retry-after', async () => {
  const waits = [];
  const { fetchImpl } = scriptedFetch([json({ message: 'slow down' }, 403, { 'retry-after': '7' }), json([], 200)]);
  const gh = createGitHub({ token: 't', fetchImpl, sleep: async (ms) => waits.push(ms) });
  assert.equal((await gh.rest('user/repos')).status, 200);
  assert.deepEqual(waits, [7000]);
});

test('graphql errors are raised', async () => {
  const { fetchImpl } = scriptedFetch([json({ errors: [{ message: 'Bad credentials' }] })]);
  const gh = createGitHub({ token: 't', fetchImpl, sleep: noSleep });
  await assert.rejects(gh.graphql('query { x }'), /Bad credentials/);
});

test('restAll follows pagination and hides request paths in errors', async () => {
  const { fetchImpl, calls } = scriptedFetch([
    json([{ id: 1 }], 200, { link: '<https://api.github.com/user/repos?page=2>; rel="next"' }),
    json([{ id: 2 }]),
  ]);
  const gh = createGitHub({ token: 't', fetchImpl, sleep: noSleep });
  assert.deepEqual(await gh.restAll('user/repos'), [{ id: 1 }, { id: 2 }]);
  assert.equal(calls[1].url, 'https://api.github.com/user/repos?page=2');

  const denied = scriptedFetch([json({ message: 'Not Found' }, 404)]);
  const gh2 = createGitHub({ token: 't', fetchImpl: denied.fetchImpl, sleep: noSleep });
  await assert.rejects(gh2.restAll('repos/acme/zz-secret/contributors'), (error) => {
    assert.match(error.message, /status 404/);
    assert.doesNotMatch(error.message, /zz-secret/);
    return true;
  });
});

test('a token is required', () => {
  assert.throws(() => createGitHub({ token: '' }), /token is required/);
});
