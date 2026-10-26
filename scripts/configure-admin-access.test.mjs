import test from 'node:test';
import assert from 'node:assert/strict';
import { configureAdminAccess, projectUrl } from './configure-admin-access.mjs';

const userId = '11111111-1111-4111-8111-111111111111';
const email = 'admin@example.test';
const key = 'sb_secret_' + 'x'.repeat(24);
const password = 'Only-a-synthetic-passphrase-42';
const options = { userId, email, key, password, repeatPassword: password, confirmation: 'ACTIVAR' };

function api({ wrongEmail = false, hasRole = true, failUpdate = false } = {}) {
  const calls = [];
  let confirmed = false;
  const fetcher = async (url, init) => {
    calls.push({ url, ...init });
    assert.ok(url.startsWith(projectUrl + '/'));
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers.apikey, key);
    assert.equal(init.headers.Authorization, undefined);
    if (url.includes('/rest/v1/admins?')) {
      return Response.json(hasRole ? [{ user_id: userId }] : []);
    }
    assert.equal(url, projectUrl + `/auth/v1/admin/users/${userId}`);
    if (init.method === 'PUT') {
      assert.deepEqual(JSON.parse(init.body), { password, email_confirm: true });
      if (failUpdate) return Response.json({ message: password }, { status: 500 });
      confirmed = true;
    }
    return Response.json({ id: userId, email: wrongEmail ? 'other@example.test' : email,
      email_confirmed_at: confirmed ? '2026-01-01T00:00:00Z' : null });
  };
  return { calls, fetcher };
}

test('updates the existing identity, confirms only that account and preserves its admin mapping', async () => {
  const mock = api();
  const result = await configureAdminAccess({ ...options, fetcher: mock.fetcher });
  assert.deepEqual(result, { userId, email, confirmed: true });
  assert.equal(mock.calls.filter(c => c.method !== 'GET').length, 1);
  assert.equal(mock.calls.some(c => c.method === 'POST' || c.method === 'DELETE'), false);
});

test('refuses to write if the UID belongs to another email', async () => {
  const mock = api({ wrongEmail: true });
  await assert.rejects(configureAdminAccess({ ...options, fetcher: mock.fetcher }), /no corresponden/);
  assert.equal(mock.calls.some(c => c.method !== 'GET'), false);
});

test('refuses to activate an account without the existing admin role', async () => {
  const mock = api({ hasRole: false });
  await assert.rejects(configureAdminAccess({ ...options, fetcher: mock.fetcher }), /no tiene el permiso/);
  assert.equal(mock.calls.some(c => c.method !== 'GET'), false);
});

test('requires explicit activation, matching passwords and valid length before any request', async () => {
  for (const changes of [{ confirmation: '' }, { repeatPassword: 'different' },
    { password: 'short', repeatPassword: 'short' },
    { password: '界'.repeat(25), repeatPassword: '界'.repeat(25) }]) {
    let called = false;
    await assert.rejects(configureAdminAccess({ ...options, ...changes,
      fetcher: async () => { called = true; throw new Error('unexpected request'); } }));
    assert.equal(called, false);
  }
});

test('rejects public API keys before sending them', async () => {
  let called = false;
  await assert.rejects(configureAdminAccess({ ...options, key: 'sb_publishable_' + 'x'.repeat(24),
    fetcher: async () => { called = true; } }), /clave secreta/);
  assert.equal(called, false);
});

test('never includes provider response bodies or secrets in reported errors and does not retry writes', async () => {
  const mock = api({ failUpdate: true });
  await assert.rejects(configureAdminAccess({ ...options, fetcher: mock.fetcher }), error => {
    assert.ok(error.message.includes('HTTP 500'));
    assert.ok(!error.message.includes(password));
    assert.ok(!error.message.includes(key));
    return true;
  });
  assert.equal(mock.calls.filter(c => c.method === 'PUT').length, 1);
});
