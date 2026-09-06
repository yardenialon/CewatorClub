/* Server configuration from environment variables. No dependencies. */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

function list(v) { return String(v || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean); }

function load(env = process.env) {
  const dataDir = path.resolve(env.CLUB_DATA_DIR || path.join(__dirname, '..', 'data'));
  // Hosted platforms (Railway, Render, Fly...) set PORT and expect the app on all interfaces.
  const hosted = !!(env.RAILWAY_ENVIRONMENT || env.RENDER || env.FLY_APP_NAME);
  const isProd = env.NODE_ENV === 'production' || hosted;
  const platformDomain = env.RAILWAY_PUBLIC_DOMAIN || env.RENDER_EXTERNAL_HOSTNAME || '';
  const webhookUrl = env.CLUB_MAIL_WEBHOOK_URL || '';
  return {
    port: Number(env.PORT) || 8765,
    host: env.CLUB_HOST || (isProd ? '0.0.0.0' : '127.0.0.1'),
    baseUrl: (env.CLUB_BASE_URL || (platformDomain ? 'https://' + platformDomain : '')).replace(/\/$/, ''),
    dataDir,
    // Signing key for session cookies: CLUB_SECRET, else a key generated once and kept in the
    // data directory so sessions survive restarts. Set CLUB_SECRET explicitly for production.
    secret: env.CLUB_SECRET || persistentSecret(dataDir),
    adminEmails: list(env.CLUB_ADMIN_EMAILS || 'admin@example.test'),
    sessionDays: Number(env.CLUB_SESSION_DAYS) || 30,
    linkMinutes: Number(env.CLUB_LINK_MINUTES) || 15,
    // Sign-in link requests allowed per IP address per 15 minutes.
    authLimit: Number(env.CLUB_AUTH_LIMIT) || 20,
    // dev: write the sign-in link to <dataDir>/outbox AND return it to the browser (local only).
    // console: print the link to the server log only (safe first step on a host without e-mail).
    // webhook: POST {from, to, subject, text} as JSON to CLUB_MAIL_WEBHOOK_URL.
    mailMode: env.CLUB_MAIL_MODE || (isProd ? (webhookUrl ? 'webhook' : 'console') : 'dev'),
    mailWebhookUrl: webhookUrl,
    mailWebhookAuth: env.CLUB_MAIL_WEBHOOK_AUTH || '',
    mailFrom: env.CLUB_MAIL_FROM || 'SimpliiGood Creator Club <no-reply@example.test>',
    isProd,
  };
}

function persistentSecret(dataDir) {
  const file = path.join(dataDir, 'secret.key');
  try { const s = fs.readFileSync(file, 'utf8').trim(); if (s.length >= 32) return s; } catch (_) { /* first run */ }
  const s = crypto.randomBytes(32).toString('hex');
  try { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(file, s, { mode: 0o600 }); } catch (_) { /* read-only FS: sessions reset on restart */ }
  return s;
}

module.exports = { load };
