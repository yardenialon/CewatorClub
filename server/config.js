/* Server configuration from environment variables. No dependencies. */
'use strict';
const path = require('node:path');
const crypto = require('node:crypto');

function list(v) { return String(v || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean); }

function load(env = process.env) {
  const dataDir = path.resolve(env.CLUB_DATA_DIR || path.join(__dirname, '..', 'data'));
  const secret = env.CLUB_SECRET || '';
  const isProd = env.NODE_ENV === 'production';
  if (isProd && secret.length < 32) throw new Error('CLUB_SECRET must be at least 32 characters in production');
  return {
    port: Number(env.PORT) || 8765,
    host: env.CLUB_HOST || '127.0.0.1',
    baseUrl: (env.CLUB_BASE_URL || '').replace(/\/$/, ''),
    dataDir,
    // Signing key for session cookies. A random key per process is fine for local use:
    // sessions simply reset on restart. Production must set CLUB_SECRET.
    secret: secret || crypto.randomBytes(32).toString('hex'),
    adminEmails: list(env.CLUB_ADMIN_EMAILS || 'admin@example.test'),
    sessionDays: Number(env.CLUB_SESSION_DAYS) || 30,
    linkMinutes: Number(env.CLUB_LINK_MINUTES) || 15,
    // Sign-in link requests allowed per IP address per 15 minutes.
    authLimit: Number(env.CLUB_AUTH_LIMIT) || 20,
    // dev: write the sign-in link to <dataDir>/outbox and return it in the API response.
    // webhook: POST {to, subject, text, html} as JSON to CLUB_MAIL_WEBHOOK_URL.
    mailMode: env.CLUB_MAIL_MODE || (isProd ? 'webhook' : 'dev'),
    mailWebhookUrl: env.CLUB_MAIL_WEBHOOK_URL || '',
    mailWebhookAuth: env.CLUB_MAIL_WEBHOOK_AUTH || '',
    mailFrom: env.CLUB_MAIL_FROM || 'SimpliiGood Creator Club <no-reply@example.test>',
    isProd,
  };
}

module.exports = { load };
