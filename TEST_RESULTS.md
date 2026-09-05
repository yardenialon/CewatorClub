# TEST_RESULTS — SimpliiGood Creator Club v0.1

Last run: 2026-09-05, Linux, Node 22, Python 3.11, Chromium 1194 (Playwright 1.56).
Both suites run automatically in GitHub Actions on every push (`.github/workflows/ci.yml`).

## Summary

| Suite | Command | Result |
|-------|---------|--------|
| Bundle freshness | `python build.py --check` | pass |
| Business rules | `node test_core.js` | 30 / 30 pass |
| Browser flow | `python test_ui.py` | 12 / 12 pass |

## What `test_core.js` covers (no browser)

- Seed data is valid, fictional (`/ Demo`, `example.test`, `example.com`) and `dispatch` never mutates its input.
- Quote formula: production fee + tiered distribution × engagement multiplier × fit, rounded to 5; blog / newsletter need a manual distribution fee; USD for US.
- Per-market stats: ILS and USD are never summed; committed = allocated − recorded; available = budget − allocated.
- Creator lifecycle: public application → pending & unverified; consent, e-mail, `https` and integer audience are enforced; only admin approves; metrics verification requires explicit confirmation.
- Missions: admin only; deadline not in the past; budget > 0; integer capacity; valid market/type/objective; brief length.
- Offers: budget reservation; blocked for pending, unverified, cross-market or duplicate creators; blocked over budget, over capacity, or at zero fee; admin only; fees frozen against later rate-card changes.
- Full state machine offered → accepted → submitted → changes → submitted → approved → published → payable → paid, including every guard on the way (consent, https, four checks, feedback required, confirmations, reference length) and role checks (creator cannot act on another creator's work).
- Decline releases slot and budget; admin cancel needs a reason and is impossible after publication; unknown commands / ids are rejected.
- `validateState` rejects wrong versions, structural damage, inconsistent totals, wrong currency, over-allocation, insecure URLs and duplicate creator/mission pairs; accepts states produced by the app.

## What `test_ui.py` covers (headless Chromium, real localStorage over 127.0.0.1)

1. Loads in Hebrew / RTL, switches to English / LTR.
2. Dashboard shows ILS and USD side by side.
3. Creator portal defaults to Maya Moves / Demo, hides other creators' work, accepts the offer.
4. `http://` draft link is rejected inline; `https://` link is submitted.
5. Approval is blocked until all four brand-safety checks are ticked, then succeeds.
6. Creator reports publication; admin verifies; admin records payment `DEMO-001`.
7. State survives a page reload.
8. New mission form creates a mission.
9. Public application form stores a pending creator.
10. Reset restores the seed.
11. Mobile viewport (390 px) shows the menu toggle and opens the sidebar.
12. No JavaScript errors or console errors during the whole run.

## Not yet verified

- Real-browser acceptance on the user's own machine (Windows, `file://` opening via `START_WINDOWS.bat`, Safari/Firefox localStorage behaviour).
- JSON backup **import** through the file picker and CSV **download** contents (the download path is exercised by code review only; browsers block script-driven downloads in the test sandbox).
- Multi-tab synchronisation via the `storage` event.
- Keyboard-only navigation and screen-reader labelling beyond what is asserted above.
- Rate-card editing through the settings form (covered at the core level, not through the UI).
- Visual regression: screenshots were reviewed manually for HE desktop, EN creator portal and HE mobile; no automated pixel comparison.
