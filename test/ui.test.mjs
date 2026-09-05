/**
 * Browser smoke test of the built index.html, following the documented
 * quick-test path (docs/GUIDE_HE.md) end to end.
 *
 *   npm run build && npm run test:ui
 *
 * Requires Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createStaticServer } from '../scripts/serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(join(process.env.NODE_GLOBAL_MODULES || '/opt/node22/lib/node_modules', 'playwright'))); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let server, browser, page, baseUrl;
const errors = [];

before(async () => {
  server = createStaticServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('dialog', dialog => dialog.accept('Demo cancellation'));
  await page.goto(baseUrl + 'index.html');
});

after(async () => {
  await browser?.close();
  server?.close();
});

const state = () => page.evaluate(() => window.ClubDemo.getState());
const assignment = async id => (await state()).assignments.find(a => a.id === id);
const modal = () => page.locator('#modal-root .modal');
const openWork = async id => {
  await page.locator(`[data-action="work"][data-id="${id}"]`).first().click();
  await modal().waitFor();
};

test('loads in Hebrew (RTL) and switches to English', async () => {
  assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
  assert.ok(await page.locator('.brandmark').isVisible());
  await page.locator('[data-action="lang"]').click();
  assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
  assert.equal(await page.getAttribute('html', 'lang'), 'en');
  assert.match(await page.locator('h1').first().innerText(), /\w/);
});

test('dashboard shows separate ILS and USD budgets', async () => {
  const kpis = await page.locator('.kpis').first().innerText();
  assert.match(kpis, /₪|ILS/);
  assert.match(kpis, /\$|USD/);
});

test('creator accepts the offer', async () => {
  await page.locator('[data-action="mode"][data-view="creator"]').first().click();
  await page.locator('#creator-picker').waitFor();
  assert.equal(await page.inputValue('#creator-picker'), 'c3'); // Maya Moves / Demo
  assert.equal(await page.locator('[data-action="work"][data-id="a1"]').count(), 0); // another creator's work is not visible

  await openWork('a2');
  await page.locator('#accept-form input[name="confirmed"]').check();
  await page.locator('#accept-form button[type="submit"]').click();
  await modal().waitFor({ state: 'hidden' });
  assert.equal((await assignment('a2')).status, 'accepted');
});

test('an insecure draft link is rejected inline; an https link is submitted', async () => {
  await openWork('a2');
  await page.fill('#content-form input[name="url"]', 'http://example.com/demo-draft');
  await page.locator('#content-form button[type="submit"]').click();
  await page.locator('#modal-errors:not(.hide)').waitFor();
  assert.equal((await assignment('a2')).status, 'accepted');

  await page.fill('#content-form input[name="url"]', 'https://example.com/demo-draft');
  await page.locator('#content-form button[type="submit"]').click();
  await modal().waitFor({ state: 'hidden' });
  assert.equal((await assignment('a2')).status, 'submitted');
});

test('admin cannot approve without all four checks, then approves', async () => {
  await page.locator('[data-action="mode"][data-view="admin"]').first().click();
  await page.locator('[data-action="nav"][data-page="review"]').first().click();
  await openWork('a2');
  await page.locator('#review-form button[value="approved"]').click();
  await page.locator('#modal-errors:not(.hide)').waitFor();
  assert.equal((await assignment('a2')).status, 'submitted');

  for (let i = 0; i < 4; i++) await page.locator(`#review-form input[name="check${i}"]`).check();
  await page.locator('#review-form button[value="approved"]').click();
  await modal().waitFor({ state: 'hidden' });
  const a = await assignment('a2');
  assert.equal(a.status, 'approved');
  assert.deepEqual(a.checks, [true, true, true, true]);
});

test('creator reports publication, admin verifies and records payment', async () => {
  await page.locator('[data-action="mode"][data-view="creator"]').first().click();
  await page.locator('#creator-picker').waitFor();
  await openWork('a2');
  await page.fill('#publication-form input[name="url"]', 'https://example.com/demo-post');
  await page.locator('#publication-form button[type="submit"]').click();
  await modal().waitFor({ state: 'hidden' });
  assert.equal((await assignment('a2')).status, 'published');

  await page.locator('[data-action="mode"][data-view="admin"]').first().click();
  await page.locator('[data-action="nav"][data-page="review"]').first().click();
  await openWork('a2');
  await page.locator('#verify-form input[name="confirmed"]').check();
  await page.locator('#verify-form button[type="submit"]').click();
  await modal().waitFor({ state: 'hidden' });
  assert.equal((await assignment('a2')).status, 'payable');

  await page.locator('[data-action="nav"][data-page="payments"]').first().click();
  await openWork('a2');
  await page.fill('#payment-form input[name="reference"]', 'DEMO-001');
  await page.locator('#payment-form input[name="confirmed"]').check();
  await page.locator('#payment-form button[type="submit"]').click();
  await modal().waitFor({ state: 'hidden' });
  const a = await assignment('a2');
  assert.equal(a.status, 'paid');
  assert.equal(a.payment.reference, 'DEMO-001');
});

test('state survives a reload (localStorage)', async () => {
  await page.reload();
  await page.locator('.brandmark').waitFor();
  assert.equal((await assignment('a2')).status, 'paid');
});

test('new mission form creates a mission with a reserved budget', async () => {
  await page.locator('[data-action="nav"][data-page="missions"]').first().click();
  const before = (await state()).missions.length;
  await page.locator('[data-action="newMission"]').first().click();
  await modal().waitFor();
  await page.fill('#mission-form input[name="title"]', 'UI test mission');
  await page.fill('#mission-form input[name="cta"]', 'Visit the demo page');
  await page.locator('#mission-form button[type="submit"]').click();
  await modal().waitFor({ state: 'hidden' });
  const s = await state();
  assert.equal(s.missions.length, before + 1);
  assert.equal(s.missions.at(-1).title, 'UI test mission');
});

test('public application form stores a pending creator', async () => {
  await page.locator('[data-action="apply"]').first().click();
  await page.locator('#apply-form').waitFor();
  await page.fill('#apply-form input[name="name"]', 'UI Applicant / Demo');
  await page.fill('#apply-form input[name="email"]', 'ui@example.test');
  await page.fill('#apply-form input[name="audience"]', '5000');
  await page.fill('#apply-form input[name="engagement"]', '3');
  await page.fill('#apply-form input[name="fit"]', '70');
  await page.fill('#apply-form input[name="niche"]', 'UI testing');
  await page.fill('#apply-form input[name="url"]', 'https://example.com/ui');
  await page.locator('#apply-form input[name="consent"]').check();
  await page.locator('#apply-form button[type="submit"]').click();
  await page.locator('#creator-table').waitFor();
  const c = (await state()).creators.at(-1);
  assert.equal(c.name, 'UI Applicant / Demo');
  assert.equal(c.status, 'pending');
});

test('reset restores the seed', async () => {
  await page.locator('[data-action="nav"][data-page="settings"]').first().click();
  await page.locator('[data-action="reset"]').click();
  await page.locator('.brandmark').waitFor();
  const s = await state();
  assert.equal(s.creators.length, 6);
  assert.equal((await assignment('a2')).status, 'offered');
});

test('mobile layout exposes the menu toggle', async () => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.reload();
  await page.locator('.menu-toggle').waitFor();
  assert.ok(await page.locator('.menu-toggle').isVisible());
  await page.locator('.menu-toggle').click();
  assert.ok((await page.getAttribute('#sidebar', 'class')).includes('open'));
});

test('no JavaScript errors were logged during the run', () => {
  assert.deepEqual(errors, []);
});
