# SimpliiGood Creator Club — Product Spec (v0.3)

Bilingual (HE/EN) prototype for running a creator & ambassador programme for a
frozen-food brand in two markets: Israel (ILS) and the United States (USD).

This document describes what v0.3 does, the rules it enforces, and what is
deliberately **not** built yet. The Hebrew user guide lives in `GUIDE_HE.md`.

## 1. Roles

| Role | How it is represented in v0.1 | Can do |
|------|-------------------------------|--------|
| Programme admin | "מנהל התוכנית" view toggle | Approve or reject applicants, verify audience metrics, create, edit and archive missions, make offers, review content, verify publication, record payments, edit rate cards, export/import backups |
| Creator | "פורטל יוצרים" view toggle + profile picker | Accept/decline offers, submit content links, resubmit after feedback, report publication |
| Public applicant | Application wizard (`?view=apply`) | Submit an application through a one-question-per-screen flow (stored as *pending*). Engagement and brand fit are collected as choices and mapped to numbers (engagement 0.5 / 2 / 4 / 6, "not sure" = 2; fit 95 / 80 / 60 / 40); the admin verifies metrics manually. |

In the offline prototype (index.html opened as a file) role switching is a demo affordance with no authentication. In connected mode (v0.3, `server/`) roles come from a signed-in session: see section 6b.

## 2. Core entities

- **Creator** — market, platform (Instagram / TikTok / YouTube / Facebook / Blog / Newsletter), audience size, engagement %, brand fit %, niche, primary URL plus optional `links` (instagram, tiktok, youtube, facebook, website; all https), deal preference (`fee` / `affiliate` / `either`), status (`pending` → `active` / `rejected`, rejection carries a reason), `metricsVerified` flag.
- **Mission** — market, format (`reel` / `story` / `blog`), objective (`dtc` / `retail` / `education`), budget, capacity (number of creators), deadline, brief, CTA, optional `archived` flag.
- **Assignment** — the contract between one creator and one mission. Has a `deal` type: `fee` (cash) or `affiliate` (products + commission, see 4b). Carries locked fees (`production`, `distribution`, `rights`, `total`, `currency`), the status below, content and publication URLs, review checks and history, and a manual payment record.
- **Rates** — per-market rate card (production fee per format, five distribution tiers by audience size). Versioned; changing rates only affects *new* quotes.
- **Activity log** — append-only audit trail of every command (capped at 5,000 entries).

## 3. Assignment state machine

```
offered ──accept──▶ accepted ──submit──▶ submitted ──approve──▶ approved ──publish──▶ published ──verify──▶ payable ──record──▶ paid
   │                    ▲                    │                                                        
   │decline             └──── resubmit ──── changes ◀── request changes ─┘
   ▼
cancelled  (admin may cancel from offered / accepted / submitted / changes / approved)
```

Guards enforced by `core.js`:

- Offers require an **active** creator with **verified metrics**, in the same market as the mission, before the deadline, with a free slot, no duplicate live assignment, and total fee within the remaining mission budget.
- Accepting requires explicit consent; declining releases both the slot and the budget.
- Content and publication links must be `https://` without embedded credentials.
- Approval requires all four brand-safety checks (product shown, no medical claims, rights, disclosure).
- Verification of publication and recording of payment each require an explicit confirmation.
- Payment record needs a reference (3–100 chars). It is a **manual note**, not a money transfer.
- Only the admin role can approve/reject creators, create/edit/archive missions, review, verify, record and cancel; only the owning creator can accept, decline, submit and publish.

### Mission editing and archiving (v0.2)

- Market (and therefore currency) is fixed at creation.
- Format can change only while no creator is assigned, because fees depend on it.
- Budget cannot go below the amount already allocated; capacity cannot go below the number of live assignments.
- A changed deadline must not be in the past; an unchanged past deadline is tolerated so other fields stay editable.
- Editing a seeded mission replaces its translated title/brief keys with the entered text.
- A mission can be archived only when every assignment is `paid` or `cancelled`. Archived missions are hidden from the creator portal and the dashboard preview, refuse new offers and edits, keep all financial history, and can be restored.

## 4. Pricing formula

```
quote = production[format]
      + round5( distributionTier[audience] × engagementMultiplier × fit% )
```

| Audience | Tier | Engagement | Multiplier |
|----------|------|------------|------------|
| < 5k | 0 | < 1% | 0.8 |
| 5k–20k | 1 | 1–3% | 1.0 |
| 20k–50k | 2 | 3–5% | 1.15 |
| 50k–100k | 3 | ≥ 5% | 1.3 |
| ≥ 100k | 4 | | |

Blog missions and Blog/Newsletter creators get no automatic distribution fee; the admin enters it manually. The admin can edit every component before creating the offer. Once created, the fees are frozen on the assignment (`rateVersion` records which rate card was used).

The **bonus / commission** field is stored as a percentage only. Sales attribution and payout of bonuses are not implemented.

Mission budget covers creator fees only. Product, frozen shipping, taxes, vendor fees, software and management time are out of scope and must be added before a commercial pilot.

### 4b. Ambassador deals (products & commission)

For micro-influencers who work without a cash fee. Chosen per offer (`deal: 'affiliate'`), defaulting to the creator's stated preference.

- A global **commission pool** (default **20%**, editable in settings via `settings.affiliate`) is split per offer into the **creator commission** and the **audience discount**. The admin sets the creator share; the remainder is the discount. Default 10% / 10%.
- The creator receives a **product package** (free text, required) and a unique **promo code** generated from their name (`TAL10`, `TAL10A`, ...), editable, 4–20 Latin letters/digits, unique among live assignments.
- Fees are all zero: the offer **does not reserve mission budget** but does take a capacity slot. A mission with budget 0 is therefore ambassadors-only.
- The pool and split are frozen on the assignment when the offer is made; later settings changes affect new offers only.
- Same workflow as paid deals. At **record payment** the admin enters the sales attributed to the code; the system stores `salesTotal` and computes `amount = salesTotal × creatorShare`. Attribution is manual; there is no store integration.
- Stats: `recorded` = recorded fees + commissions; `committed` uses fees only, so commissions never touch mission budgets; `commissions` and `affiliateOpen` are reported separately.

## 5. Dashboard metrics (per market)

| Metric | Definition |
|--------|-----------|
| Budget | Sum of mission budgets |
| Allocated | Sum of fees on non-cancelled assignments |
| Recorded | Fees on `paid` assignments plus settled commissions |
| Commissions | Settled commission amounts on `paid` affiliate assignments |
| Payable | Fees on `payable` assignments |
| Committed | Allocated − recorded fees |
| Available | Budget − Allocated |

ILS and USD are never summed together.

## 6. Data & persistence

- State is a single JSON document, validated by `validateState()` on load, on every command, and on backup import.
- Stored in `localStorage` under `simpliigood.creatorclub.v1`; language preference under `simpliigood.creatorclub.prefs`.
- Multi-tab: the app reloads state on the `storage` event and re-reads the latest revision before each command.
- Export/import as JSON (max 2 MB). CSV export of payable/paid assignments with formula-injection protection.
- Reset restores seed data.

### 6b. Connected mode (v0.3)

- `server/index.js` serves the same `index.html` and exposes a small JSON API: `GET /api/session`, `POST /api/auth/request`, `GET /auth/callback`, `POST /api/auth/logout`, `GET /api/state`, `POST /api/command`.
- Every change goes through `ClubCore.dispatch` on the server with the actor taken from the session, never from the request body. The client's own `dispatch` is bypassed in this mode.
- Sign-in is a single-use magic link (15 minutes, hashed at rest) sent to an address that is either a configured admin or a non-rejected creator's e-mail. Sessions are HMAC-signed, HttpOnly, SameSite=Lax cookies (30 days) and are re-resolved on every request, so a rejected creator loses access immediately.
- Creators receive a scoped state: their own profile, their assignments, non-archived missions in their market (with `openSlots` precomputed), no rates, no activity log, no other creators.
- Unauthenticated requests may only run `creator.apply` (the public application form).
- Storage is `data/state.json` and `data/auth.json` behind `server/store.js`; the store interface (`loadState/saveState/loadAuth/saveAuth`) is the single place to swap in a database.
- Mail delivery: `dev` writes the link to `data/outbox` and returns it to the UI; `webhook` POSTs `{from,to,subject,text}` to a configured URL. SMTP is deliberately not implemented; any relay with an HTTP endpoint works.
- Hardening in place: same-origin check on POST, 256 KB body limit (413), per-IP rate limit on link requests, no e-mail enumeration (identical answers), constant-time cookie verification, `nosniff` and `no-referrer` headers, refusal to start on a corrupt state file.

### 6c. Public landing page (v0.3.1)

- In connected mode a signed-out visitor lands on `renderLanding()` (`app/36-landing.js`), not on the sign-in form. Sign-in is one tap away (header, hero, footer) and is its own screen (`app/37-login.js`); `?auth=invalid` opens it directly.
- Structure follows a single decision path: promise (hero) → proof strip → how it works → the two tracks → what the product is / what we never ask → objections (FAQ) → final call. Every number on the page is backed by a rule in `core.js` (20% pool, 10/10 split, two markets, human approval); there are no invented testimonials or follower counts.
- Copy principles: second person, presuppositions about the creator's existing audience, low-commitment first step ("2 minutes", "no cost, no commitment, no script"), explicit autonomy ("your voice, your pace", "you can change later"), and objections answered before the call to action.
- Brand assets: `assets/logo.png` (optional) is served at `/assets/logo.png`, inlined by `build.py`, and probed only when `/api/session` reports it exists; otherwise an SVG wordmark is drawn. Heebo is self-hosted under `assets/fonts/` and loaded only over HTTP, so the offline file never makes a request.

## 7. Security posture of the prototype

- Self-contained HTML with a strict CSP (`default-src 'none'`, no network, no external fonts/scripts).
- All rendered strings are HTML-escaped; URLs are re-validated before being rendered as links and open with `rel="noopener noreferrer"`.
- No real personal data should be entered. Seed data uses `example.com` / `example.test` only.

## 8. Not in v0.1 (required for a real service)

1. ~~Accounts, authentication, role-based permissions, server-side state~~ (v0.3, single-process JSON store; a real database, backups and multi-instance deployment are still open).
2. Notification e-mails to creators (offers, feedback, approvals). Only the sign-in link is delivered today, and only via a webhook relay you configure.
3. File/video upload and storage.
4. Real social-platform verification of audience metrics and published posts.
5. Payment execution (bank transfer, PayPal, etc.) and accounting exports.
6. Automatic sales attribution to promo codes (commission is computed from a manually reported sales total).
7. Contract / rights agreement e-signature.
8. AI brief generation (the "brief builder" currently inserts the default brief).
9. Analytics on content performance.
10. ~~Real logo and brand font assets~~ (font self-hosted; the logo file slots into `assets/logo.png`, see README).

## 9. Suggested roadmap

| Phase | Goal |
|-------|------|
| 0.2 ✅ | Split `app.js` into view modules; creator rejection; mission editing/archiving; unit tests for UI helpers (`format.js`) |
| 0.3 ✅ | Dependency-free Node server with the same command/dispatch model, JSON store behind a swappable interface, magic-link sign-in, role-scoped state |
| 0.3.1 ✅ | Public landing page, redesigned sign-in, brand assets (logo slot + self-hosted font), Railway deployment |
| 0.4 | Postgres store + hosted deployment; notification e-mails (offer, feedback, approval); file upload for drafts; contract acceptance record |
| 0.5 | Instagram/TikTok API metric checks; payout provider integration |
