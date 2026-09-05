#!/usr/bin/env python3
"""Browser tests for the built index.html, following the quick-test path in README.md.

    python build.py
    pip install playwright && python -m playwright install chromium
    python test_ui.py

Serves the project folder on 127.0.0.1 (random port) so that localStorage behaves
like it does for a real user, then walks the full demo flow in headless Chromium.
Playwright is required for these tests only, never for the prototype itself.
"""
import sys
import threading
import unittest
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from serve import make_server  # noqa: E402


class DemoFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = make_server(0)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}/index.html"
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch()
        cls.page = cls.browser.new_page(viewport={"width": 1280, "height": 900})
        cls.errors = []
        cls.page.on("pageerror", lambda err: cls.errors.append(str(err)))
        cls.page.on("console", lambda msg: cls.errors.append(msg.text) if msg.type == "error" else None)
        cls.page.on("dialog", lambda d: d.accept("Demo cancellation"))
        cls.page.goto(cls.base)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()

    # helpers -----------------------------------------------------------
    def state(self):
        return self.page.evaluate("() => window.ClubDemo.getState()")

    def assignment(self, aid):
        return next(a for a in self.state()["assignments"] if a["id"] == aid)

    def modal(self):
        return self.page.locator("#modal-root .modal")

    def open_work(self, aid):
        self.page.locator(f'[data-action="work"][data-id="{aid}"]').first.click()
        self.modal().wait_for()

    def modal_closed(self):
        self.modal().wait_for(state="hidden")

    def switch(self, view):
        self.page.locator(f'[data-action="mode"][data-view="{view}"]').first.click()
        if view == "creator":
            self.page.locator("#creator-picker").wait_for()

    def nav(self, page_name):
        self.page.locator(f'[data-action="nav"][data-page="{page_name}"]').first.click()

    # tests run in definition order (test_01 ... test_12) ----------------
    def test_01_loads_hebrew_and_switches_to_english(self):
        page = self.page
        self.assertEqual(page.get_attribute("html", "dir"), "rtl")
        self.assertTrue(page.locator(".brandmark").is_visible())
        page.locator('[data-action="lang"]').click()
        self.assertEqual(page.get_attribute("html", "dir"), "ltr")
        self.assertEqual(page.get_attribute("html", "lang"), "en")

    def test_02_dashboard_keeps_ils_and_usd_separate(self):
        kpis = self.page.locator(".kpis").first.inner_text()
        self.assertRegex(kpis, r"₪|ILS")
        self.assertRegex(kpis, r"\$|USD")

    def test_03_creator_accepts_offer(self):
        self.switch("creator")
        self.assertEqual(self.page.input_value("#creator-picker"), "c3")  # Maya Moves / Demo
        self.assertEqual(self.page.locator('[data-action="work"][data-id="a1"]').count(), 0)  # other creator's work hidden
        self.open_work("a2")
        self.page.locator('#accept-form input[name="confirmed"]').check()
        self.page.locator('#accept-form button[type="submit"]').click()
        self.modal_closed()
        self.assertEqual(self.assignment("a2")["status"], "accepted")

    def test_04_insecure_link_rejected_then_https_submitted(self):
        self.open_work("a2")
        self.page.fill('#content-form input[name="url"]', "http://example.com/demo-draft")
        self.page.locator('#content-form button[type="submit"]').click()
        self.page.locator("#modal-errors:not(.hide)").wait_for()
        self.assertEqual(self.assignment("a2")["status"], "accepted")
        self.page.fill('#content-form input[name="url"]', "https://example.com/demo-draft")
        self.page.locator('#content-form button[type="submit"]').click()
        self.modal_closed()
        self.assertEqual(self.assignment("a2")["status"], "submitted")

    def test_05_admin_needs_all_four_checks_to_approve(self):
        self.switch("admin")
        self.nav("review")
        self.open_work("a2")
        self.page.locator('#review-form button[value="approved"]').click()
        self.page.locator("#modal-errors:not(.hide)").wait_for()
        self.assertEqual(self.assignment("a2")["status"], "submitted")
        for i in range(4):
            self.page.locator(f'#review-form input[name="check{i}"]').check()
        self.page.locator('#review-form button[value="approved"]').click()
        self.modal_closed()
        a = self.assignment("a2")
        self.assertEqual(a["status"], "approved")
        self.assertEqual(a["checks"], [True, True, True, True])

    def test_06_publish_verify_and_record_payment(self):
        self.switch("creator")
        self.open_work("a2")
        self.page.fill('#publication-form input[name="url"]', "https://example.com/demo-post")
        self.page.locator('#publication-form button[type="submit"]').click()
        self.modal_closed()
        self.assertEqual(self.assignment("a2")["status"], "published")

        self.switch("admin")
        self.nav("review")
        self.open_work("a2")
        self.page.locator('#verify-form input[name="confirmed"]').check()
        self.page.locator('#verify-form button[type="submit"]').click()
        self.modal_closed()
        self.assertEqual(self.assignment("a2")["status"], "payable")

        self.nav("payments")
        self.open_work("a2")
        self.page.fill('#payment-form input[name="reference"]', "DEMO-001")
        self.page.locator('#payment-form input[name="confirmed"]').check()
        self.page.locator('#payment-form button[type="submit"]').click()
        self.modal_closed()
        a = self.assignment("a2")
        self.assertEqual(a["status"], "paid")
        self.assertEqual(a["payment"]["reference"], "DEMO-001")

    def test_07_state_survives_reload(self):
        self.page.reload()
        self.page.locator(".brandmark").wait_for()
        self.assertEqual(self.assignment("a2")["status"], "paid")

    def test_08_new_mission_form(self):
        self.nav("missions")
        before = len(self.state()["missions"])
        self.page.locator('[data-action="newMission"]').first.click()
        self.modal().wait_for()
        self.page.fill('#mission-form input[name="title"]', "UI test mission")
        self.page.fill('#mission-form input[name="cta"]', "Visit the demo page")
        self.page.locator('#mission-form button[type="submit"]').click()
        self.modal_closed()
        missions = self.state()["missions"]
        self.assertEqual(len(missions), before + 1)
        self.assertEqual(missions[-1]["title"], "UI test mission")

    def test_09_application_form_stores_pending_creator(self):
        page = self.page
        page.locator('[data-action="apply"]').first.click()
        page.locator("#apply-form").wait_for()
        page.fill('#apply-form input[name="name"]', "UI Applicant / Demo")
        page.fill('#apply-form input[name="email"]', "ui@example.test")
        page.fill('#apply-form input[name="audience"]', "5000")
        page.fill('#apply-form input[name="engagement"]', "3")
        page.fill('#apply-form input[name="fit"]', "70")
        page.fill('#apply-form input[name="niche"]', "UI testing")
        page.fill('#apply-form input[name="url"]', "https://example.com/ui")
        page.locator('#apply-form input[name="consent"]').check()
        page.locator('#apply-form button[type="submit"]').click()
        page.locator("#creator-table").wait_for()
        c = self.state()["creators"][-1]
        self.assertEqual(c["name"], "UI Applicant / Demo")
        self.assertEqual(c["status"], "pending")

    def test_10_reset_restores_seed(self):
        self.nav("settings")
        self.page.locator('[data-action="reset"]').click()
        self.page.locator(".brandmark").wait_for()
        self.assertEqual(len(self.state()["creators"]), 7)
        self.assertEqual(self.assignment("a2")["status"], "offered")

    def test_11_mobile_menu_toggle(self):
        self.page.set_viewport_size({"width": 390, "height": 800})
        self.page.reload()
        toggle = self.page.locator(".menu-toggle")
        toggle.wait_for()
        self.assertTrue(toggle.is_visible())
        toggle.click()
        self.assertIn("open", self.page.get_attribute("#sidebar", "class"))

    def test_12_reject_applicant(self):
        self.page.set_viewport_size({"width": 1280, "height": 900})
        self.page.reload()
        self.page.locator(".brandmark").wait_for()
        self.switch("admin")
        self.nav("creators")
        self.page.locator('[data-action="creatorDetail"][data-id="c5"]').click()  # Lia Fresh / Demo, pending
        self.modal().wait_for()
        self.page.locator('[data-action="rejectCreator"]').click()  # confirm + prompt are auto-accepted
        self.modal_closed()
        c = next(c for c in self.state()["creators"] if c["id"] == "c5")
        self.assertEqual(c["status"], "rejected")
        self.assertEqual(c["rejectReason"], "Demo cancellation")

    def test_13_edit_mission_respects_allocated_budget(self):
        self.nav("missions")
        self.page.locator('[data-action="missionDetail"][data-id="m1"]').first.click()
        self.modal().wait_for()
        self.page.locator('[data-action="editMission"]').click()
        self.page.locator('#mission-form[data-id="m1"]').wait_for()
        self.assertEqual(self.page.locator('#mission-form select[name="market"]').count(), 0)  # market locked
        self.page.fill('#mission-form input[name="title"]', "Edited mission")
        self.page.fill('#mission-form input[name="budget"]', "1")
        self.page.locator('#mission-form button[type="submit"]').click()
        self.page.locator("#modal-errors:not(.hide)").wait_for()
        self.page.fill('#mission-form input[name="budget"]', "4000")
        self.page.locator('#mission-form button[type="submit"]').click()
        self.modal_closed()
        m = next(m for m in self.state()["missions"] if m["id"] == "m1")
        self.assertEqual(m["title"], "Edited mission")
        self.assertEqual(m["budget"], 4000)
        self.assertNotIn("titleKey", m)

    def test_14_archive_and_restore_mission(self):
        # m1 has open work: archiving must fail with an inline error
        self.page.locator('[data-action="missionDetail"][data-id="m1"]').first.click()
        self.modal().wait_for()
        self.page.locator('[data-action="archiveMission"]').click()
        self.page.locator("#modal-errors:not(.hide)").wait_for()
        self.page.keyboard.press("Escape")
        self.modal_closed()
        # a fresh mission can be archived, disappears from the list, and comes back on restore
        self.page.locator('[data-action="newMission"]').first.click()
        self.modal().wait_for()
        self.page.fill('#mission-form input[name="title"]', "Archive me")
        self.page.fill('#mission-form input[name="cta"]', "Visit the demo page")
        self.page.locator('#mission-form button[type="submit"]').click()
        self.modal_closed()
        mid = self.state()["missions"][-1]["id"]
        card = self.page.locator(f'[data-action="missionDetail"][data-id="{mid}"]')
        card.first.click()
        self.modal().wait_for()
        self.page.locator('[data-action="archiveMission"]').click()
        self.modal_closed()
        self.assertTrue(next(m for m in self.state()["missions"] if m["id"] == mid)["archived"])
        self.assertEqual(card.count(), 0)
        self.page.locator('[data-action="toggleArchived"]').click()
        self.assertEqual(card.count(), 1)
        card.first.click()
        self.modal().wait_for()
        self.assertEqual(self.page.locator('[data-action="offer"]').count(), 0)
        self.page.locator('[data-action="restoreMission"]').click()
        self.modal_closed()
        self.assertNotIn("archived", next(m for m in self.state()["missions"] if m["id"] == mid))
        # archived missions never reach the creator portal
        self.switch("creator")
        self.assertGreaterEqual(self.page.locator('[data-action="missionDetail"]').count(), 1)

    def test_15_affiliate_offer_uses_no_budget(self):
        self.switch("admin")
        self.nav("missions")
        self.page.locator('[data-action="missionDetail"][data-id="m3"]').first.click()
        self.modal().wait_for()
        self.page.locator('[data-action="offer"]').click()
        self.page.locator("#offer-form").wait_for()
        self.page.select_option('#offer-form select[name="creatorId"]', "c7")  # Tal Bites prefers products & commission
        self.assertEqual(self.page.input_value('#offer-form select[name="deal"]'), "affiliate")
        self.assertTrue(self.page.locator("#affiliate-section").is_visible())
        self.assertFalse(self.page.locator("#fee-section").is_visible())
        self.assertEqual(self.page.locator("#audience-discount").inner_text(), "10%")
        self.page.fill('#offer-form input[name="creatorShare"]', "12")
        self.assertEqual(self.page.locator("#audience-discount").inner_text(), "8%")
        self.page.fill('#offer-form input[name="productPackage"]', "Starter pack: 3 boxes")
        allocated_before = self.page.evaluate("() => window.ClubDemo.core.allocation(window.ClubDemo.getState(), 'm3')")
        self.page.locator('#offer-form button[type="submit"]').click()
        self.modal_closed()
        a = self.state()["assignments"][-1]
        self.assertEqual((a["deal"], a["creatorId"], a["missionId"], a["fees"]["total"]), ("affiliate", "c7", "m3", 0))
        self.assertEqual((a["affiliate"]["creatorShare"], a["affiliate"]["audienceDiscount"]), (12, 8))
        self.assertRegex(a["affiliate"]["promoCode"], r"^[A-Z0-9]{4,20}$")
        self.assertEqual(self.page.evaluate("() => window.ClubDemo.core.allocation(window.ClubDemo.getState(), 'm3')"), allocated_before)

    def test_16_ambassador_settings_apply_to_new_offers(self):
        self.nav("settings")
        self.page.locator("#affiliate-form").wait_for()
        self.page.fill('#affiliate-form input[name="pool"]', "25")
        self.page.fill('#affiliate-form input[name="creatorShare"]', "15")
        self.page.locator('#affiliate-form button[type="submit"]').click()
        self.page.locator("#toast:not(.hide)").wait_for()
        self.assertEqual(self.state()["affiliate"], {"pool": 25, "creatorShare": 15})

    def test_99_no_javascript_errors(self):
        self.assertEqual(self.errors, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
