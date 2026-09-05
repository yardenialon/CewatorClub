/**
 * API tests for server/ (magic-link sign-in, role scoping, command dispatch).
 *   node test_server.js
 * Runs the server in-process on a random port with a temporary data directory.
 */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { start } = require('./server/index.js');

const ADMIN = 'admin@example.test';
const MAYA = 'maya@example.test'; // creator c3, has offer a2 on mission m2
let app, base, dataDir;

const client = (cookie = '') => ({
  cookie,
  async get(p, opts = {}) { return fetch(base + p, { headers: { cookie }, redirect: 'manual', ...opts }); },
  async post(p, body, headers = {}) {
    return fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json', cookie, ...headers }, body: JSON.stringify(body) });
  },
});

async function signIn(email) {
  const anon = client();
  const r = await anon.post('/api/auth/request', { email });
  assert.equal(r.status, 200);
  const { devLink } = await r.json();
  assert.ok(devLink, 'dev mode returns the link');
  const cb = await anon.get(new URL(devLink).pathname + new URL(devLink).search);
  assert.equal(cb.status, 302);
  assert.equal(cb.headers.get('location'), '/');
  const cookie = cb.headers.get('set-cookie').split(';')[0];
  assert.match(cb.headers.get('set-cookie'), /HttpOnly/);
  assert.match(cb.headers.get('set-cookie'), /SameSite=Lax/);
  return { ...client(cookie), devLink };
}

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'club-test-'));
  app = await start({ port: 0, env: { CLUB_DATA_DIR: dataDir, CLUB_ADMIN_EMAILS: ADMIN, CLUB_MAIL_MODE: 'dev', CLUB_SECRET: 'x'.repeat(40), CLUB_AUTH_LIMIT: '30' } });
  base = app.url;
});

after(async () => {
  await app.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('static and session', () => {
  test('serves index.html and reports remote mode to anonymous visitors', async () => {
    const page = await client().get('/');
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<title>SimpliiGood/);
    const ses = await (await client().get('/api/session')).json();
    assert.equal(ses.mode, 'remote');
    assert.equal(ses.authenticated, false);
    assert.equal(ses.mailMode, 'dev');
  });

  test('state and commands need a session; public application does not', async () => {
    assert.equal((await client().get('/api/state')).status, 401);
    assert.equal((await client().post('/api/command', { command: 'mission.create', payload: {} })).status, 401);
    const r = await client().post('/api/command', { command: 'creator.apply', payload: { name: 'API Applicant / Demo', email: 'api@example.test', market: 'US', platform: 'TikTok', audience: 7000, engagement: 4, fit: 75, niche: 'API testing', url: 'https://example.com/api', consent: true } });
    assert.equal(r.status, 200);
    assert.equal(app.getState().creators.at(-1).status, 'pending');
  });

  test('seed is persisted to the data directory', () => {
    const saved = JSON.parse(fs.readFileSync(path.join(dataDir, 'state.json'), 'utf8'));
    assert.equal(saved.version, 1);
  });
});

describe('magic-link sign-in', () => {
  test('unknown addresses get the same answer but no link', async () => {
    const r = await client().post('/api/auth/request', { email: 'nobody@example.test' });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  });

  test('admin receives a link, the link signs in once, and the outbox has a copy', async () => {
    const admin = await signIn(ADMIN);
    const ses = await (await admin.get('/api/session')).json();
    assert.equal(ses.role, 'admin');
    assert.equal(ses.email, ADMIN);
    const outbox = fs.readdirSync(path.join(dataDir, 'outbox'));
    assert.ok(outbox.length >= 1);
    // second use of the same token is refused
    const u = new URL(admin.devLink);
    const again = await client().get(u.pathname + u.search);
    assert.equal(again.headers.get('location'), '/?auth=invalid');
  });

  test('a forged cookie is ignored', async () => {
    const forged = client('club_session=eyJyb2xlIjoiYWRtaW4ifQ.AAAA');
    assert.equal((await forged.get('/api/state')).status, 401);
  });

  test('logout clears the cookie', async () => {
    const admin = await signIn(ADMIN);
    const r = await admin.post('/api/auth/logout', {});
    assert.match(r.headers.get('set-cookie'), /Max-Age=0/);
  });

  test('a rejected creator can no longer sign in', async () => {
    const admin = await signIn(ADMIN);
    const applicant = app.getState().creators.find(c => c.email === 'api@example.test');
    const r = await admin.post('/api/command', { command: 'creator.reject', payload: { id: applicant.id, reason: 'Test rejection' } });
    assert.equal(r.status, 200);
    const req = await client().post('/api/auth/request', { email: 'api@example.test' });
    assert.deepEqual(await req.json(), { ok: true }); // no devLink
  });
});

describe('role scoping and commands', () => {
  test('admin sees the whole state and can run admin commands', async () => {
    const admin = await signIn(ADMIN);
    const { state } = await (await admin.get('/api/state')).json();
    assert.ok(state.creators.length >= 6);
    assert.ok(state.activity.length >= 1);
    assert.ok(state.rates.IL);
    const r = await admin.post('/api/command', { command: 'mission.create', payload: { title: 'Server mission', market: 'US', type: 'story', objective: 'education', budget: 400, capacity: 2, deadline: '2999-01-01', brief: 'A brief written through the API.', cta: 'Go' } });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.state.missions.at(-1).title, 'Server mission');
    assert.equal(body.revision, app.getState().revision);
  });

  test('admin cannot act as a creator', async () => {
    const admin = await signIn(ADMIN);
    const r = await admin.post('/api/command', { command: 'assignment.accept', payload: { id: 'a2', confirmed: true } });
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error, 'statusInvalid');
  });

  test('creator sees only their own slice', async () => {
    const maya = await signIn(MAYA);
    const ses = await (await maya.get('/api/session')).json();
    assert.equal(ses.role, 'creator');
    assert.equal(ses.creatorId, 'c3');
    const { state } = await (await maya.get('/api/state')).json();
    assert.deepEqual(state.creators.map(c => c.id), ['c3']);
    assert.ok(state.assignments.every(a => a.creatorId === 'c3'));
    assert.deepEqual(state.activity, []);
    assert.deepEqual(state.rates, {});
    assert.ok(state.missions.every(m => m.market === 'US'));
    assert.ok(state.missions.every(m => typeof m.openSlots === 'number'));
  });

  test('creator can accept their own offer but not review or touch others', async () => {
    const maya = await signIn(MAYA);
    let r = await maya.post('/api/command', { command: 'assignment.review', payload: { id: 'a1', decision: 'approved', checks: [true, true, true, true] } });
    assert.equal(r.status, 400);
    r = await maya.post('/api/command', { command: 'assignment.submit', payload: { id: 'a1', url: 'https://example.com/x' } });
    assert.equal(r.status, 400);
    r = await maya.post('/api/command', { command: 'assignment.accept', payload: { id: 'a2', confirmed: true } });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.state.assignments.find(a => a.id === 'a2').status, 'accepted');
    assert.equal(app.getState().assignments.find(a => a.id === 'a2').status, 'accepted');
  });

  test('archived missions disappear from the creator view', async () => {
    const admin = await signIn(ADMIN);
    const mission = app.getState().missions.find(m => m.title === 'Server mission');
    assert.equal((await admin.post('/api/command', { command: 'mission.archive', payload: { id: mission.id } })).status, 200);
    const maya = await signIn(MAYA);
    const { state } = await (await maya.get('/api/state')).json();
    assert.ok(!state.missions.some(m => m.id === mission.id));
  });
});

describe('hardening', () => {
  test('cross-origin POSTs are refused', async () => {
    const admin = await signIn(ADMIN);
    const r = await admin.post('/api/command', { command: 'mission.create', payload: {} }, { origin: 'https://evil.example' });
    assert.equal(r.status, 403);
  });

  test('malformed JSON and oversized bodies are rejected', async () => {
    const admin = await signIn(ADMIN);
    const bad = await fetch(base + '/api/command', { method: 'POST', headers: { 'content-type': 'application/json', cookie: admin.cookie }, body: '{not json' });
    assert.equal(bad.status, 400);
    const huge = await admin.post('/api/command', { command: 'mission.create', payload: { brief: 'x'.repeat(300 * 1024) } });
    assert.equal(huge.status, 413);
  });

  test('sign-in requests are rate limited per IP', async () => {
    const statuses = [];
    for (let i = 0; i < 40; i++) statuses.push((await client().post('/api/auth/request', { email: 'nobody2@example.test' })).status);
    assert.ok(statuses.includes(429));
  });

  test('unknown API routes return 404 JSON', async () => {
    const r = await client().get('/api/nothing');
    assert.equal(r.status, 404);
  });
});
