#!/usr/bin/env node
/* SimpliiGood Creator Club server (v0.3). Standard library only.
 *
 *   node server/index.js                    http://127.0.0.1:8765/
 *   CLUB_ADMIN_EMAILS=you@example.com node server/index.js
 *
 * The server owns the club state, runs every change through ClubCore.dispatch
 * (the same rules the offline prototype uses) and persists after each command.
 * Creators see only their own slice of the state. See README.md for the
 * environment variables and .env.example for a template.
 */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const ClubCore = require('../core.js');
const config = require('./config.js');
const { JsonStore } = require('./store.js');
const auth = require('./auth.js');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const ASSET_TYPES = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const COOKIE = 'club_session';
const PUBLIC_COMMANDS = new Set(['creator.apply']);

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders });
  res.end(JSON.stringify(body));
}

function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0, tooLarge = false; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) tooLarge = true; else chunks.push(c); });
    req.on('end', () => {
      if (tooLarge) return reject(new Error('payloadTooLarge')); // body fully drained, so the client gets a real answer
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (_) { reject(new Error('invalidJson')); }
    });
    req.on('error', reject);
  });
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** What a signed-in user is allowed to see. Admins get everything. */
function scopeState(state, session) {
  if (!session) return null;
  if (session.role === 'admin') return state;
  const me = state.creators.find(c => c.id === session.creatorId);
  if (!me) return null;
  const mine = state.assignments.filter(a => a.creatorId === me.id);
  const mineMissions = new Set(mine.map(a => a.missionId));
  const missions = state.missions
    .filter(m => mineMissions.has(m.id) || (!m.archived && m.market === me.market))
    .map(m => ({ ...m, openSlots: Math.max(0, m.capacity - ClubCore.missionCount(state, m.id)) }));
  return { version: state.version, revision: state.revision, updatedAt: state.updatedAt, ratesVersion: state.ratesVersion, rates: {}, creators: [me], missions, assignments: mine, activity: [] };
}

function createApp(options = {}) {
  const cfg = options.config || config.load(options.env);
  const store = options.store || new JsonStore(cfg.dataDir);
  let state = store.loadState();
  if (!state) { state = ClubCore.createSeed(); store.saveState(state); }
  ClubCore.validateState(state); // refuse to start on a corrupt file
  const indexFile = path.join(ROOT, 'index.html');
  const attempts = new Map(); // ip -> timestamps of sign-in requests

  function rateLimited(ip) {
    const now = Date.now(), recent = (attempts.get(ip) || []).filter(t => now - t < 15 * 60000);
    recent.push(now); attempts.set(ip, recent);
    return recent.length > cfg.authLimit;
  }

  function sessionOf(req) {
    const payload = auth.verify(parseCookies(req.headers.cookie)[COOKIE], cfg.secret);
    if (!payload) return null;
    // Re-resolve on every request so a rejected creator or removed admin loses access immediately.
    return auth.identify(payload.email, state, cfg);
  }

  function setCookie(res, value, maxAge) {
    const secure = cfg.baseUrl.startsWith('https://') ? '; Secure' : '';
    res.setHeader('set-cookie', `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`);
  }

  function sameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true; // same-origin fetches from older browsers omit it; cookies are SameSite=Lax anyway
    try { return new URL(origin).host === req.headers.host; } catch (_) { return false; }
  }

  function requestOrigin(req) {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    return `${proto}://${req.headers.host}`;
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const ip = req.socket.remoteAddress || 'unknown';
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(fs.readFileSync(indexFile));
    }

    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
      // Brand assets (logo, self-hosted fonts). Only known binary types, never outside assets/.
      const file = path.resolve(ASSETS, '.' + url.pathname.slice('/assets'.length));
      const type = ASSET_TYPES[path.extname(file).toLowerCase()];
      if (!type || !file.startsWith(ASSETS + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found'); }
      res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=86400' });
      return res.end(fs.readFileSync(file));
    }

    if (req.method === 'GET' && url.pathname === '/auth/callback') {
      const email = auth.redeem(url.searchParams.get('token'), store);
      const identity = email && auth.identify(email, state, cfg);
      if (!identity) { res.writeHead(302, { location: '/?auth=invalid' }); return res.end(); }
      setCookie(res, auth.sessionCookie(identity, cfg), cfg.sessionDays * 86400);
      res.writeHead(302, { location: '/' });
      return res.end();
    }

    if (!url.pathname.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found'); }
    if (req.method === 'POST' && !sameOrigin(req)) return json(res, 403, { error: 'forbidden' });

    const session = sessionOf(req);

    if (req.method === 'GET' && url.pathname === '/api/session') {
      return json(res, 200, { mode: 'remote', authenticated: !!session, role: session?.role || null, email: session?.email || null, creatorId: session?.creatorId || null, name: session?.name || null, mailMode: cfg.mailMode, revision: state.revision, logo: fs.existsSync(path.join(ASSETS, 'logo.png')) });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/request') {
      if (rateLimited(ip)) return json(res, 429, { error: 'tooManyRequests' });
      const body = await readBody(req);
      const email = auth.normalizeEmail(body.email);
      const identity = auth.identify(email, state, cfg);
      // Always answer the same way so the form cannot be used to probe which e-mails exist.
      if (!identity) return json(res, 200, { ok: true });
      const link = auth.issueLink(email, store, cfg, requestOrigin(req));
      try {
        const result = await auth.deliver(email, link, cfg);
        return json(res, 200, cfg.mailMode === 'dev' ? { ok: true, devLink: result.devLink } : { ok: true });
      } catch (err) {
        console.error('mail delivery failed:', err.message);
        return json(res, 502, { error: 'mailFailed' });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      setCookie(res, '', 0);
      return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/state') {
      if (!session) return json(res, 401, { error: 'signInRequired' });
      return json(res, 200, { state: scopeState(state, session) });
    }

    if (req.method === 'POST' && url.pathname === '/api/command') {
      let body;
      try { body = await readBody(req); } catch (err) { return json(res, err.message === 'payloadTooLarge' ? 413 : 400, { error: err.message }); }
      const command = String(body.command || '');
      if (!session && !PUBLIC_COMMANDS.has(command)) return json(res, 401, { error: 'signInRequired' });
      const actor = session ? { role: session.role, creatorId: session.creatorId } : { role: 'public' };
      try {
        const next = ClubCore.dispatch(state, command, body.payload || {}, actor);
        store.saveState(next);
        state = next;
        return json(res, 200, { ok: true, revision: state.revision, state: session ? scopeState(state, session) : null });
      } catch (err) {
        return json(res, 400, { error: err.message });
      }
    }

    return json(res, 404, { error: 'notFound' });
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch(err => {
      console.error(err);
      if (!res.headersSent) json(res, 500, { error: 'serverError' });
      else res.end();
    });
  });
  return { server, config: cfg, store, getState: () => state };
}

function start(options = {}) {
  const app = createApp(options);
  return new Promise(resolve => {
    app.server.listen(options.port ?? app.config.port, options.host ?? app.config.host, () => {
      const { address, port } = app.server.address();
      const url = `http://${address}:${port}`;
      resolve({ ...app, url, close: () => new Promise(r => app.server.close(r)) });
    });
  });
}

if (require.main === module) {
  start().then(({ url, config: cfg }) => {
    console.log(`SimpliiGood Creator Club server: ${url}/`);
    console.log(`Admin e-mails: ${cfg.adminEmails.join(', ')} | mail mode: ${cfg.mailMode} | data: ${cfg.dataDir}`);
    if (cfg.mailMode === 'dev') console.log('Sign-in links are written to data/outbox and shown in the UI (dev mode).');
    if (cfg.mailMode === 'console') console.log('No mail provider configured: sign-in links are printed to this log only. Set CLUB_MAIL_WEBHOOK_URL to send e-mail.');
    if (cfg.isProd && !cfg.baseUrl) console.log('Warning: CLUB_BASE_URL is not set; sign-in links will use the request host.');
  }).catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { createApp, start, scopeState };
