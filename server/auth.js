/* Magic-link sign-in and signed session cookies. Standard library only.
 *
 * Flow: POST /api/auth/request {email}  ->  single-use token (15 min) mailed as a link
 *       GET  /auth/callback?token=...    ->  token redeemed, HMAC-signed cookie set
 * Who may sign in: addresses in CLUB_ADMIN_EMAILS (role admin) and creators whose
 * e-mail exists in the club state and is not rejected (role creator).
 */
'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const b64 = buf => Buffer.from(buf).toString('base64url');
const unb64 = s => Buffer.from(s, 'base64url');
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const normalizeEmail = e => String(e || '').trim().toLowerCase();

function sign(payload, secret) {
  const body = b64(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', secret).update(body).digest();
  return body + '.' + b64(mac);
}

function verify(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  let given;
  try { given = unb64(mac); } catch (_) { return null; }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(unb64(body).toString('utf8'));
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch (_) { return null; }
}

/** Resolve an e-mail to a role, or null when nobody may sign in with it. */
function identify(email, state, cfg) {
  const e = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  if (cfg.adminEmails.includes(e)) return { role: 'admin', email: e, name: e };
  const c = state.creators.find(x => normalizeEmail(x.email) === e && x.status !== 'rejected');
  if (c) return { role: 'creator', email: e, creatorId: c.id, name: c.name };
  return null;
}

function pruneTokens(auth) {
  const now = Date.now();
  for (const [k, v] of Object.entries(auth.tokens)) if (!v || v.exp < now) delete auth.tokens[k];
}

/** Create a single-use sign-in token and return the absolute link. */
function issueLink(email, store, cfg, origin) {
  const auth = store.loadAuth();
  pruneTokens(auth);
  const token = crypto.randomBytes(32).toString('base64url');
  auth.tokens[hash(token)] = { email: normalizeEmail(email), exp: Date.now() + cfg.linkMinutes * 60000 };
  store.saveAuth(auth);
  return (cfg.baseUrl || origin) + '/auth/callback?token=' + encodeURIComponent(token);
}

/** Redeem a token exactly once. Returns the e-mail or null. */
function redeem(token, store) {
  if (typeof token !== 'string' || token.length < 20) return null;
  const auth = store.loadAuth();
  pruneTokens(auth);
  const key = hash(token);
  const rec = auth.tokens[key];
  if (!rec) return null;
  delete auth.tokens[key];
  store.saveAuth(auth);
  return rec.email;
}

function sessionCookie(identity, cfg) {
  const exp = Date.now() + cfg.sessionDays * 86400000;
  return sign({ ...identity, exp }, cfg.secret);
}

/** Deliver the link. dev -> outbox file (+ returned so the UI can show it); webhook -> HTTP POST. */
async function deliver(email, url, cfg) {
  const subject = 'SimpliiGood Creator Club: your sign-in link';
  const text = `Sign in to SimpliiGood Creator Club:\n\n${url}\n\nThe link works once and expires in ${cfg.linkMinutes} minutes. If you did not request it, ignore this message.`;
  if (cfg.mailMode === 'webhook') {
    if (!cfg.mailWebhookUrl) throw new Error('CLUB_MAIL_WEBHOOK_URL is not set');
    const headers = { 'content-type': 'application/json' };
    if (cfg.mailWebhookAuth) headers.authorization = cfg.mailWebhookAuth;
    const res = await fetch(cfg.mailWebhookUrl, { method: 'POST', headers, body: JSON.stringify({ from: cfg.mailFrom, to: email, subject, text }) });
    if (!res.ok) throw new Error('mail webhook responded ' + res.status);
    return { delivered: true };
  }
  const dir = path.join(cfg.dataDir, 'outbox');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, new Date().toISOString().replace(/[:.]/g, '-') + '-' + email.replace(/[^a-z0-9@.]/gi, '_') + '.txt');
  fs.writeFileSync(file, `To: ${email}\nSubject: ${subject}\n\n${text}\n`);
  return { delivered: false, devLink: url, file };
}

module.exports = { sign, verify, identify, issueLink, redeem, sessionCookie, deliver, normalizeEmail };
