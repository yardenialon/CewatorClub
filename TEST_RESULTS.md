# TEST_RESULTS — SimpliiGood Creator Club v0.3.1

Last run: 2026-09-06, Linux, Node 22, Python 3.11, Chromium 1194 (Playwright 1.56).
All suites run automatically in GitHub Actions on every push (`.github/workflows/ci.yml`).

## Summary

| Suite | Command | Result |
|-------|---------|--------|
| Bundle freshness | `python build.py --check` | pass |
| Business rules | `node test_core.js` | 54 / 54 pass |
| Formatting helpers | `node test_format.js` | 15 / 15 pass |
| Server API | `node test_server.js` | 17 / 17 pass |
| Browser flow, offline prototype | `python test_ui.py` | 18 / 18 pass |
| Browser flow, connected mode | `python test_ui_server.py` | 7 / 7 pass |

## What `test_core.js` covers (no browser)

- Seed data is valid, fictional (`/ Demo`, `example.test`, `example.com`) and `dispatch` never mutates its input.
- Quote formula: production fee + tiered distribution × engagement multiplier × fit, rounded to 5; blog / newsletter need a manual distribution fee; USD for US.
- Per-market stats: ILS and USD are never summed; committed = allocated − recorded; available = budget − allocated.
- Creator lifecycle: public application → pending & unverified; consent, e-mail, `https` and integer audience are enforced; only admin approves; metrics verification requires explicit confirmation.
- Missions: admin only; deadline not in the past; budget > 0; integer capacity; valid market/type/objective; brief length.
- Offers: budget reservation; blocked for pending, unverified, cross-market or duplicate creators; blocked over budget, over capacity, or at zero fee; admin only; fees frozen against later rate-card changes.
- Full state machine offered → accepted → submitted → changes → submitted → approved → published → payable → paid, including every guard on the way (consent, https, four checks, feedback required, confirmations, reference length) and role checks (creator cannot act on another creator's work).
- Decline releases slot and budget; admin cancel needs a reason and is impossible after publication; unknown commands / ids are rejected.
- Application links: primary URL follows the main platform then the first link; at least one https link; unknown keys rejected by backup validation.
- Creator rejection: reason required, admin only, pending only; a rejected creator cannot be approved or offered.
- Mission editing: title/objective/budget/capacity/deadline/brief/CTA; budget and capacity floors; format locked once assigned; past deadline rules; admin only; seeded title keys replaced.
- Mission archive / restore: blocked while work is open; archived missions refuse offers and edits; restore reopens; financial stats unchanged; backup validation rejects an archived mission with open work.
- Ambassador deals: seed pool 20% and preference; affiliate offer uses no budget, splits 10/10 by default, share bounded by pool, remainder to audience; promo codes generated, unique and validated; product package required; zero-budget missions accept affiliate but not paid offers; settlement computes commission from reported sales and keeps mission budgets untouched; pool/share settings apply to new offers only; application preference stored; backup validation guards the invariants.
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
9. Application wizard: empty name and missing links show inline errors; Enter advances; choices auto-advance; summary shows the entered name; consent is enforced; the stored creator has the right platform, primary URL derived from it, extra links, numeric metrics and deal preference; the done screen leads back to the creators table.
10. Reset restores the seed.
11. Mobile viewport (390 px) shows the menu toggle and opens the sidebar.
12. Admin rejects a pending applicant through the confirm + reason prompts.
13. Edit mission: market field is locked; a budget below the allocated amount is refused inline; a valid edit is saved.
14. Archive: refused on a mission with open work; a fresh mission is archived, disappears from the list, reappears under "show archived" without an offer button, and is restored.
15. Affiliate offer: choosing an ambassador creator flips the deal type, hides fees, shows the split (10% / 10%, then 12% / 8% after editing), submits with zero budget impact.
16. Ambassador settings form updates pool and default share.
17. Public landing page (offline preview): tracks render, FAQ opens, language toggle flips direction, final call opens the wizard.
18. No JavaScript errors or console errors during the whole run.

## What `test_format.js` covers

HTML escaping, initials, currency/number/date formatting per locale, CSV quoting and formula-injection protection, CSV assembly with BOM and CRLF.

## What `test_server.js` covers (server in-process, temp data dir, dev mail)

- Serves index.html; `/api/session` reports remote mode; state and commands need a session; the public application does not; seed is persisted.
- Magic link: unknown addresses get the same answer without a link; admin link signs in once and the second use is refused; the outbox holds a copy; forged cookies are ignored; logout clears the cookie; a rejected creator can no longer request a link.
- Scoping: admin sees everything and can create missions; admin cannot act as a creator; creator sees only own profile/assignments, US missions with `openSlots`, no rates or activity; creator can accept own offer but not review or submit others' work; archived missions vanish from the creator view.
- Hardening: cross-origin POST is refused (403); malformed JSON (400) and oversized bodies (413); per-IP rate limit (429); unknown API routes (404).

## What `test_ui_server.py` covers (Node server as a subprocess, headless Chromium)

1. Anonymous visitor sees the public landing page (no sign-in form, no demo role toggle, no creator picker); FAQ opens; hero call opens the wizard; wizard → sign-in → back to landing.
2. An invalid link lands on the sign-in screen.
3. Admin signs in through the dev link, creates a mission, it lands in `data/state.json`, and survives a reload with localStorage cleared.
4. Creator signs in, sees only her own portal and work, accepts her offer, and the server records it.
5. Sign out returns to the public landing page.
6. Public application wizard works without a session; "not sure" engagement maps to 2; the done screen returns to the landing page.
7. No JavaScript or console errors.

## Not yet verified

- Real-browser acceptance on the user's own machine (Windows, `file://` opening via `START_WINDOWS.bat`, Safari/Firefox localStorage behaviour).
- JSON backup **import** through the file picker and CSV **download** contents (the download path is exercised by code review only; browsers block script-driven downloads in the test sandbox).
- Multi-tab synchronisation via the `storage` event (offline mode); in connected mode a second tab only refreshes after its own next action.
- Webhook mail delivery against a real relay (only the dev outbox path is exercised).
- Behaviour behind a reverse proxy with `CLUB_BASE_URL` and `Secure` cookies.
- Keyboard-only navigation and screen-reader labelling beyond what is asserted above.
- Rate-card editing through the settings form (covered at the core level, not through the UI).
- Visual regression: screenshots were reviewed manually for HE desktop, EN creator portal and HE mobile; no automated pixel comparison.
