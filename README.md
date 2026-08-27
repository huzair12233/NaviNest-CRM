# NaviNest Realtors CRM

A modern, full-stack real-estate CRM for **NaviNest Realtors**, a growing Navi Mumbai
brokerage. It runs the working life of the business around one connected lifecycle:

> **Lead → Qualification → Requirement → Property Matching → Property Shared → Follow-up →
> Site Visit → Feedback → Negotiation → Token/Booking → Deal → Closure → Commission →
> Post-deal relationship**

Every dashboard number, chart and report is derived live from the database. Create a lead
and the counters move; close a deal and a commission record opens, the property is marked
sold, and the lead flips to *Converted* — automatically.

---

## 1. What was built

| Area | Included |
|---|---|
| **Auth & roles** | Email/password login, JWT httpOnly-cookie sessions, 3 roles (Admin / Manager / Sales Executive), **server-enforced** row-level visibility |
| **Dashboard** | 12 actionable KPI cards (each links to a filtered view), lead-flow area chart, status donut, source bar chart, pipeline funnel, live activity feed |
| **My Day** | Per-user command centre: overdue & today's follow-ups, hot leads, site visits, tasks, deals in negotiation |
| **Leads** | All / Sale / Rental views, rich filters (status, temperature, priority, BHK, ageing bucket, owner, source), search, pagination, full requirement capture, **duplicate phone detection**, lead detail with activity timeline, matched properties, quick actions (call, WhatsApp, log, follow-up, site visit, status, assign, temperature) |
| **Property matching** | Transparent **rule-based** 0–100 score (location, budget, BHK, area, type, furnishing, parking). Not "AI" — a documented weighting in `src/lib/matching.ts` |
| **Follow-ups** | Today / Overdue / Upcoming / Completed tabs, complete-with-outcome + auto-schedule-next |
| **Site visits** | Scheduling + structured post-visit feedback (interest, rating, likes/dislikes, objections, price feedback, next action) written to the lead timeline |
| **Properties** | Inventory with availability lifecycle, detail page with matched/interested leads, owner, transaction history |
| **Projects / Societies, Owners, Contacts** | Directory modules; owners show all their properties; contacts block duplicate phone numbers |
| **Pipeline** | Kanban board by stage with per-card stage advance controls |
| **Deals & Commissions** | Deal lifecycle, stage automation, commission auto-created on *Closed Won* with expected/received/pending, employee/company split; commission edit gated to managers |
| **Channel Partners, Tasks, Notifications** | Lightweight partner ledger, task management, in-app notification centre |
| **Reports** | **Lead source attribution funnel** (Source → Leads → Qualified → Visits → Deals → Conversion), lead ageing, site-visit outcomes, team performance |
| **System** | Team management (Admin), Settings (configurable lead sources), global search, audit log, activity timeline |
| **UX** | Custom design system, responsive (mobile card views for tables), empty/loading/error states, toasts, slide-over drawers, confirmation on destructive changes |

---

## 2. Technology stack & why

| Layer | Choice | Reasoning |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | One deployable full-stack app; React Server Components keep data-heavy CRM pages fast; Server Actions remove most client/API glue |
| Data | **Prisma ORM** | Type-safe queries, painless migrations, portable across databases |
| Database | **SQLite in dev**, **PostgreSQL in production** | Zero-setup local dev so the app *just runs*; the schema is written to be Postgres-portable (enum-like values are `String` + validated centrally). See §7 |
| Auth | **`jose` (JWT) + `bcryptjs`**, httpOnly cookie | No heavy dependency; full control; enforced in every Server Action / loader via `requireUser()` / `requireRole()` |
| Styling | **Tailwind CSS v3** + hand-built component library | Distinctive, consistent UI without a generic admin-template look |
| Validation | **Zod**, shared schemas | Same rules on client hints and server enforcement |
| Charts | **Recharts** | Mature, composable, SSR-friendly |
| Icons | **lucide-react** | Clean, consistent icon set |

---

## 3. Project structure

```
prisma/
  schema.prisma          data model (16 models)
  seed.ts                clean start: 1 admin + lead sources
  seed-demo.ts           full fictional demo dataset
  migrations/
src/
  app/
    login/               auth screen
    (app)/               authenticated shell (sidebar + topbar)
      dashboard/  my-day/  leads/  contacts/  follow-ups/  tasks/
      site-visits/  properties/  projects/  owners/  pipeline/
      deals/  commissions/  channel-partners/  reports/
      team-performance/  notifications/  team/  settings/
    api/search/          global search endpoint
  components/
    ui/                  design-system primitives (button, badge, card, table,
                         drawer, toast, query-controls, tabs, …)
    form/                ActionForm + typed fields + CreateDrawer
    shell/               sidebar, topbar, global search
  features/              domain logic grouped by module
    <module>/actions.ts  "use server" mutations (validate → write → activity/audit → revalidate)
    <module>/queries.ts  scoped read queries
    <module>/*.tsx       module-specific components
  lib/
    db.ts  auth.ts  rbac.ts  validation.ts  matching.ts  activity.ts
    constants.ts  utils.ts  pagination.ts  action-result.ts
scripts/
  e2e-smoke.mjs          Playwright end-to-end workflow test
```

**Separation of concerns:** UI primitives never touch the database; pages/loaders read
via `features/*/queries.ts`; every write goes through a validated Server Action in
`features/*/actions.ts` that also records an Activity and (for tracked fields) an AuditLog
entry, then revalidates affected paths.

---

## 4. Database design

16 models. Key relationships:

- **Lead** — the hub. Has many `FollowUp`, `SiteVisit`, `PropertyInterest`, `Activity`,
  `Deal`, `Task`. Belongs to `User` (assignee), `LeadSource`, `ChannelPartner`, `Contact`.
  Requirement fields (budget, BHK, locations, furnishing, rent/deposit, move-in, …) live on
  the lead itself.
- **Property** — belongs to `Owner` and `Project`. Has many `PropertyInterest` (shared /
  interested / rejected leads), `SiteVisit`, `Deal`, `Activity`. One `status`
  (Available → Hold → UnderNegotiation → Sold/Rented → Inactive).
- **PropertyInterest** — join table Lead ↔ Property with status + match score.
- **Deal** — links Lead, Property, Contact, Owner, ChannelPartner. Has one **Commission**
  (created automatically on *Closed Won*).
- **Commission** — dealValue, %, expected / received / pending, employee vs company split.
- **Activity** — polymorphic timeline rows (lead / property / deal).
- **AuditLog** — user, action, entity, field, old → new value.
- **User, LeadSource, Owner, Contact, ChannelPartner, Project, FollowUp, SiteVisit, Task,
  Notification**.

`prisma/schema.prisma` is the source of truth and is commented.

---

## 5. Running it

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env          # set AUTH_SECRET + ADMIN_PASSWORD

# 3. Database
npm run db:migrate            # create schema
npm run db:seed               # clean start: 1 admin + lead sources
#   -- OR --
npm run db:seed:demo         # full fictional demo dataset (leads, deals, …)

# 4. Dev server
npm run dev                   # http://localhost:3000
```

### Login

- **Clean seed:** the account in `ADMIN_EMAIL` / `ADMIN_PASSWORD` (default `admin@navinest.in` / `changeme123`).
- **Demo seed:** `admin@navinest.in` (Admin), `priya@navinest.in` (Manager), `rahul@navinest.in` (Sales) — all password `navinest`.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build & serve |
| `npm run db:migrate` | Create/apply a migration (dev) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Wipe everything, create 1 admin + lead sources |
| `npm run db:seed:demo` | Wipe everything, load full fictional dataset |
| `npm run db:studio` | Prisma Studio (browse the DB) |
| `node scripts/e2e-smoke.mjs` | Playwright end-to-end test (dev server must be running) |

---

## 6. Authentication & authorization

- Login validates against `bcrypt`-hashed passwords, then issues a signed JWT
  (`jose`, HS256, 7-day expiry) in an **httpOnly, SameSite=Lax** cookie.
- Every authenticated page and every Server Action calls `requireUser()` /
  `requireRole()` — there is **no** trust in the client.
- **Row-level visibility** is enforced in the database query via `src/lib/rbac.ts`:
  - Admin / Manager: all records.
  - Sales Executive: only leads/follow-ups/visits/deals assigned to (or created by) them.
- Financial edits (commission) require Manager+. Team & Settings require Admin.

---

## 7. Deploying to PostgreSQL

1. In `prisma/schema.prisma` change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Postgres connection string and a strong `AUTH_SECRET`.
3. `npx prisma migrate deploy` then optionally `npm run db:seed`.
4. Deploy (Vercel, a Node host, or Docker). The app is a standard Next.js build.

The schema deliberately avoids DB-specific features (native enums, array columns) so this
switch needs no data-model rewrite. Enum-like values are `String` columns validated in
`src/lib/constants.ts` + Zod; list fields (preferred locations, amenities) are
comma-separated strings.

---

## 8. Test results

`node scripts/e2e-smoke.mjs` drives a real browser through the core workflow — **17/17 checks pass**:

```
1.  admin login → dashboard                                  ✓
    dashboard reads Total Leads from DB                       ✓
2.  create lead via form (validation, dup-check)              ✓
3.  Total Leads KPI increments 64 → 65 (live data)            ✓
4.  schedule follow-up → appears in timeline                  ✓
    complete follow-up with outcome → timeline updated        ✓
5.  log a call → shows in activity timeline                   ✓
6.  share a matched property → "Properties shared" section    ✓
7.  create property via form                                  ✓
8.  create deal linked to lead                                ✓
    move deal to Closed Won                                   ✓
    commission record auto-created                            ✓
    linked lead auto-moved to Converted                       ✓
9.  global search finds the new lead                          ✓
10. Sales user redirected away from /team (RBAC)              ✓
    Sales user sees only scoped leads (33 vs 64)              ✓
11. mobile layout renders (390px)                             ✓
```

`npm run build` compiles cleanly with **no TypeScript or lint errors**; all 30+ routes
type-check and prerender.

Manually verified: dashboard drill-downs, pipeline stage moves, site-visit feedback,
commission editing, notifications, reports, responsive nav.

---

## 8a. Performance / "the dev server feels laggy"

`npm run dev` is **not** representative of real speed. It compiles each route the first
time you visit it (2–20 s), ships unminified bundles, runs React in development mode and
does no caching — so the first click to any page or action stalls for a second or two.

Measured on this machine:

| | `npm run dev` (first visit) | `npm run dev` (warm) | **`npm run build` + `npm start`** |
|---|---|---|---|
| Dashboard | ~27 s | ~2 s | **~0.16 s** |
| Leads / Pipeline / Reports | 6–11 s | 1.5–3 s | **~0.15 s** |

**To evaluate performance, always use the production build:**

```bash
npm run build && npm start
```

Additional optimisations applied for scale: DB indexes on every hot filter/sort column
(`Lead.lastActivityAt`, `Lead.createdAt`, `Property.status/listingType`, `Deal.leadId/closedAt`,
`FollowUp`/`SiteVisit` `leadId`+`assignedToId`, …); list queries select only what the table
renders; Server Actions rely on `revalidatePath()` alone (no redundant client refetch);
skeleton `loading.tsx` on every route so navigation feels instant.

---

## 9. Key architectural decisions

1. **Server Actions over a REST/GraphQL API.** Fewer moving parts for a single-team app;
   validation, authz, mutation, activity logging and cache revalidation live in one place.
2. **RSC-first reads.** List/detail pages are Server Components querying Prisma directly
   with the RBAC `where` fragment merged in — no client data-fetching, no over-fetching.
3. **Activity + Audit as first-class.** Almost every mutation writes an `Activity` (the
   human timeline) and, for tracked fields, an `AuditLog` (who changed what, old → new).
4. **Rule-based matching, honestly labelled.** The scoring function is small, weighted and
   readable; the UI says "rule-based fit", never "AI".
5. **Portable schema.** SQLite for a frictionless clone-and-run; documented one-line switch
   to PostgreSQL for production.
6. **Design system, not a template.** Hand-built primitives and a NaviNest brand palette
   (teal = trust, warm neutrals = property, ink = technology).

---

## 10. Intentionally left for later

Architecturally supported (models/hooks exist) but not fully built, to avoid
over-engineering NaviNest's current stage:

- **Real WhatsApp / call / SMS / email integrations.** Actions currently open `tel:` /
  `wa.me`; the `Activity` model is ready to record real message/call events when a provider
  (e.g. WhatsApp Cloud API, a telephony gateway) is connected.
- **Real-time / push / email notifications.** `Notification` records are created in-app;
  delivery channels (web-push, email digest) are a follow-on.
- **CSV/Excel import wizard.** Export and the model are ready; the upload→map→validate→
  dedupe→confirm flow is scoped but not implemented.
- **Document storage.** No `Document` model yet — deliberately deferred until there's a
  storage backend (S3/R2).
- **Calendar view.** Follow-ups, visits and tasks are all date-stamped; a month/week
  calendar surface is a presentation-layer addition.
- **Full drag-and-drop pipeline.** Current board uses explicit stage-advance controls
  (more reliable); HTML5 DnD is a polish item.
- **Granular permission editor.** Roles are fixed (Admin/Manager/Sales); the `rbac.ts`
  helpers are structured so a permissions matrix can be layered on.
- **Lead scoring model & deal-probability tuning.** Stage-based probability is in; a
  weighted lead score (budget fit + requirement completeness + recency + visit history) is
  designed in `matching.ts` territory but not surfaced.

---

*Built as a working foundation NaviNest can start using immediately and grow from 3 to 30+ users.*
