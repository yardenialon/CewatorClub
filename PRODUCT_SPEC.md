# SimpliiGood Creator Club — Product Spec (v0.2)

Bilingual (HE/EN) prototype for running a creator & ambassador programme for a
frozen-food brand in two markets: Israel (ILS) and the United States (USD).

This document describes what v0.2 does, the rules it enforces, and what is
deliberately **not** built yet. The Hebrew user guide lives in `GUIDE_HE.md`.

## 1. Roles

| Role | How it is represented in v0.1 | Can do |
|------|-------------------------------|--------|
| Programme admin | "מנהל התוכנית" view toggle | Approve or reject applicants, verify audience metrics, create, edit and archive missions, make offers, review content, verify publication, record payments, edit rate cards, export/import backups |
| Creator | "פורטל יוצרים" view toggle + profile picker | Accept/decline offers, submit content links, resubmit after feedback, report publication |
| Public applicant | Application form | Submit an application (stored as *pending*) |

Role switching is a demo affordance. There is no authentication.

## 2. Core entities

- **Creator** — market, platform (Instagram / TikTok / YouTube / Blog / Newsletter), audience size, engagement %, brand fit %, niche, portfolio URL, status (`pending` → `active` / `rejected`, rejection carries a reason), `metricsVerified` flag.
- **Mission** — market, format (`reel` / `story` / `blog`), objective (`dtc` / `retail` / `education`), budget, capacity (number of creators), deadline, brief, CTA, optional `archived` flag.
- **Assignment** — the contract between one creator and one mission. Carries locked fees (`production`, `distribution`, `rights`, `total`, `currency`), the status below, content and publication URLs, review checks and history, and a manual payment record.
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

## 5. Dashboard metrics (per market)

| Metric | Definition |
|--------|-----------|
| Budget | Sum of mission budgets |
| Allocated | Sum of fees on non-cancelled assignments |
| Recorded | Fees on `paid` assignments |
| Payable | Fees on `payable` assignments |
| Committed | Allocated − Recorded |
| Available | Budget − Allocated |

ILS and USD are never summed together.

## 6. Data & persistence

- State is a single JSON document, validated by `validateState()` on load, on every command, and on backup import.
- Stored in `localStorage` under `simpliigood.creatorclub.v1`; language preference under `simpliigood.creatorclub.prefs`.
- Multi-tab: the app reloads state on the `storage` event and re-reads the latest revision before each command.
- Export/import as JSON (max 2 MB). CSV export of payable/paid assignments with formula-injection protection.
- Reset restores seed data.

## 7. Security posture of the prototype

- Self-contained HTML with a strict CSP (`default-src 'none'`, no network, no external fonts/scripts).
- All rendered strings are HTML-escaped; URLs are re-validated before being rendered as links and open with `rel="noopener noreferrer"`.
- No real personal data should be entered. Seed data uses `example.com` / `example.test` only.

## 8. Not in v0.1 (required for a real service)

1. Accounts, authentication, role-based permissions, server-side state.
2. Email/notification delivery to creators.
3. File/video upload and storage.
4. Real social-platform verification of audience metrics and published posts.
5. Payment execution (bank transfer, PayPal, etc.) and accounting exports.
6. Sales attribution and bonus calculation.
7. Contract / rights agreement e-signature.
8. AI brief generation (the "brief builder" currently inserts the default brief).
9. Analytics on content performance.
10. Real logo and brand font assets.

## 9. Suggested roadmap

| Phase | Goal |
|-------|------|
| 0.2 ✅ | Split `app.js` into view modules; creator rejection; mission editing/archiving; unit tests for UI helpers (`format.js`) |
| 0.3 | Backend (Supabase/Postgres or similar) with the same command/dispatch model; magic-link auth for creators |
| 0.4 | Email notifications; file upload for drafts; contract acceptance record |
| 0.5 | Instagram/TikTok API metric checks; payout provider integration |
