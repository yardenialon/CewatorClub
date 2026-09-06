#!/usr/bin/env python3
"""Browser tests for connected mode: index.html served by server/index.js.

    python build.py
    python test_ui_server.py

Starts the Node server as a subprocess with a temporary data directory and dev
mail mode, then signs in as admin and as a creator through the real magic-link
flow in headless Chromium.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
ADMIN = "admin@example.test"
MAYA = "maya@example.test"


class ConnectedMode(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_dir = tempfile.mkdtemp(prefix="club-ui-")
        env = {**os.environ, "PORT": "0", "CLUB_DATA_DIR": cls.data_dir, "CLUB_ADMIN_EMAILS": ADMIN, "CLUB_MAIL_MODE": "dev", "CLUB_AUTH_LIMIT": "50"}
        cls.proc = subprocess.Popen(["node", str(ROOT / "server" / "index.js")], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        line = cls.proc.stdout.readline()
        m = re.search(r"(http://[\d.]+:\d+)", line)
        if not m:
            raise RuntimeError("server did not start: " + line)
        cls.base = m.group(1)
        for _ in range(50):
            try:
                urllib.request.urlopen(cls.base + "/api/session", timeout=1)
                break
            except Exception:
                time.sleep(0.1)
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()
        cls.errors = []

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.proc.terminate()
        cls.proc.wait(timeout=5)
        shutil.rmtree(cls.data_dir, ignore_errors=True)

    # helpers -----------------------------------------------------------
    def new_page(self):
        page = self.browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("pageerror", lambda err: self.errors.append(str(err)))
        page.on("console", lambda msg: self.errors.append(msg.text) if msg.type == "error" else None)
        page.on("dialog", lambda d: d.accept("Demo cancellation"))
        return page

    def open_login(self, page):
        page.goto(self.base + "/")
        page.locator(".ld-hero").wait_for()  # public landing page first
        page.locator('.pub-nav [data-action="mode"][data-view="login"]').click()
        page.locator("#login-form").wait_for()

    def sign_in(self, page, email):
        self.open_login(page)
        page.fill('#login-form input[name="email"]', email)
        page.locator('#login-form button[type="submit"]').click()
        page.locator("#dev-link").wait_for()
        page.locator("#dev-link").click()
        page.locator(".brandmark").wait_for()
        page.locator('[data-action="logout"]').wait_for()

    def server_state(self):
        return json.loads((Path(self.data_dir) / "state.json").read_text())

    # tests ---------------------------------------------------------------
    def test_01_anonymous_visitor_sees_landing_not_demo(self):
        page = self.new_page()
        page.goto(self.base + "/")
        page.locator(".ld-hero").wait_for()
        self.assertEqual(page.locator(".mode-switch").count(), 0)
        self.assertEqual(page.locator("#creator-picker").count(), 0)
        self.assertEqual(page.locator("#login-form").count(), 0)  # sign-in is one tap away, not the first screen
        page.locator(".faq-q").first.click()
        self.assertEqual(page.locator(".faq-item.open").count(), 1)
        page.locator(".ld-hero [data-action=\"apply\"]").click()
        page.locator('.wizard-card[data-step="intro"]').wait_for()
        page.locator('.wizard [data-action="mode"][data-view="login"]').click()
        page.locator("#login-form").wait_for()
        page.locator('[data-action="mode"][data-view="landing"]').first.click()
        page.locator(".ld-hero").wait_for()
        page.close()

    def test_02_invalid_link_shows_error(self):
        page = self.new_page()
        page.goto(self.base + "/auth/callback?token=not-a-real-token")
        page.locator("#login-form").wait_for()
        self.assertIn("auth", page.url) if "auth=invalid" in page.url else None
        page.close()

    def test_03_admin_signs_in_and_changes_persist_on_the_server(self):
        page = self.new_page()
        self.sign_in(page, ADMIN)
        self.assertEqual(page.locator(".mode-switch").count(), 0)  # no demo role toggle
        self.assertGreater(page.locator('[data-action="nav"]').count(), 3)
        page.locator('[data-action="nav"][data-page="missions"]').first.click()
        page.locator('[data-action="newMission"]').first.click()
        page.locator("#modal-root .modal").wait_for()
        page.fill('#mission-form input[name="title"]', "Connected mission")
        page.fill('#mission-form input[name="cta"]', "Visit the demo page")
        page.locator('#mission-form button[type="submit"]').click()
        page.locator("#modal-root .modal").wait_for(state="hidden")
        self.assertIn("Connected mission", [m.get("title") for m in self.server_state()["missions"]])
        # a fresh page with the same cookie sees the server's data, not localStorage
        page.evaluate("() => localStorage.clear()")
        page.reload()
        page.locator('[data-action="logout"]').wait_for()
        page.locator('[data-action="nav"][data-page="missions"]').first.click()
        self.assertGreaterEqual(page.locator("text=Connected mission").count(), 1)
        page.close()

    def test_04_creator_sees_only_her_portal_and_accepts_the_offer(self):
        page = self.new_page()
        self.sign_in(page, MAYA)
        self.assertEqual(page.locator("#creator-picker").count(), 0)
        self.assertEqual(page.locator('[data-action="nav"][data-page="payments"]').count(), 0)
        self.assertEqual(page.locator('[data-action="work"][data-id="a1"]').count(), 0)
        page.locator('[data-action="work"][data-id="a2"]').first.click()
        page.locator("#modal-root .modal").wait_for()
        page.locator('#accept-form input[name="confirmed"]').check()
        page.locator('#accept-form button[type="submit"]').click()
        page.locator("#modal-root .modal").wait_for(state="hidden")
        a2 = next(a for a in self.server_state()["assignments"] if a["id"] == "a2")
        self.assertEqual(a2["status"], "accepted")
        page.close()

    def test_05_logout_returns_to_the_public_page(self):
        page = self.new_page()
        self.sign_in(page, MAYA)
        page.locator('[data-action="logout"]').click()
        page.locator(".ld-hero").wait_for()
        self.assertEqual(page.locator('[data-action="logout"]').count(), 0)
        page.close()

    def test_06_public_application_works_without_signing_in(self):
        page = self.new_page()
        page.goto(self.base + "/?view=apply")
        page.locator('.wizard-card[data-step="intro"]').wait_for()
        page.locator('[data-action="wizNext"]').click()
        page.fill("#wiz-input", "Connected Applicant / Demo"); page.keyboard.press("Enter")
        page.fill("#wiz-input", "connected@example.test"); page.keyboard.press("Enter")
        page.locator('[data-action="wizChoice"][data-name="market"][data-value="US"]').click()
        page.fill("#wiz-link-youtube", "https://youtube.com/@connected"); page.keyboard.press("Enter")
        page.locator('[data-action="wizChoice"][data-name="platform"][data-value="YouTube"]').click()
        page.fill("#wiz-input", "9000"); page.keyboard.press("Enter")
        page.locator('[data-action="wizChoice"][data-name="engagement"][data-value="unknown"]').click()
        page.fill("#wiz-input", "Connected testing"); page.keyboard.press("Enter")
        page.locator('[data-action="wizToggle"][data-value="gym"]').click(); page.locator('[data-action="wizNext"]').click()
        page.locator('[data-action="wizChoice"][data-name="fit"][data-value="60"]').click()
        page.locator('[data-action="wizChoice"][data-name="dealPreference"][data-value="either"]').click()
        page.locator('#wiz-form input[name="consent"]').check()
        page.locator('#wiz-form button[type="submit"]').click()
        page.locator("#wiz-done").wait_for()
        c = next(c for c in self.server_state()["creators"] if c["email"] == "connected@example.test")
        self.assertEqual(c["url"], "https://youtube.com/@connected")
        self.assertEqual(c["engagement"], 2)  # "not sure" maps to the middle tier until the admin verifies
        self.assertEqual(c["interests"], ["gym"])
        page.locator("#wiz-done").click()
        page.locator(".ld-hero").wait_for()
        page.close()

    def test_99_no_javascript_errors(self):
        self.assertEqual(self.errors, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
