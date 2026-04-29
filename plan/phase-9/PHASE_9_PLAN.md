# Phase 9 — Admin Product Ingestion & Scheduled Publishing

**Status:** 🚧 In Progress
**Dependencies:** Phases 1–8 must be complete
**Baseline:** 307/307 tests passing, 0 TypeScript errors, 0 ESLint warnings.

---

## Overview

Phase 9 extends the admin panel (Phase 8) with two workflow features that let operators curate the catalogue:

1. **Import Product by ASIN** — admin enters an ASIN, clicks Sync, and a draft product row is created from live Amazon PA-API data.
2. **Schedule Product Publishing** — admin sets a future `publish_at` timestamp on a draft; a cron-driven Edge Function flips `is_active=true` when the time arrives.

Both features are English-only (admin panel convention) and never execute Amazon PA-API calls from Node.js — all PA-API traffic goes through Supabase Edge Functions using Vault-stored keys.

---

## Features

| # | Feature | Document |
|---|---|---|
| 9.1 | Import Product by ASIN | [features/F9.1-asin-import.md](features/F9.1-asin-import.md) |
| 9.2 | Schedule Product Publishing | [features/F9.2-scheduled-publishing.md](features/F9.2-scheduled-publishing.md) |

Full test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Acceptance Criteria

### Feature 9.1 — ASIN Import
- [ ] POST `/admin/api/products/import` with `{ asin }` returns 201 `{ product_id, asin, name }` when PA-API returns a hit.
- [ ] ASIN validation rejects strings that are not exactly 10 alphanumeric characters (400 Zod error).
- [ ] When the ASIN already exists, the row is updated via `upsert` on `asin` (no duplicate inserted).
- [ ] When the Edge Function returns a non-2xx or throws, the route returns 502 with a JSON error body.
- [ ] New products are inserted with `is_active: false` (draft).
- [ ] The primary image (if present) is upserted into `product_images`.
- [ ] Amazon keys are never read from Next.js `process.env` — the Edge Function resolves them from `Deno.env`.
- [ ] Dashboard widget renders ASIN input + Sync button, shows spinner during request, success message with product name linking to `/admin/products/<id>`, and error message on failure.

### Feature 9.2 — Scheduled Publishing
- [ ] Migration `00008_product_scheduling.sql` adds `publish_at TIMESTAMPTZ NULL`, the partial index, and the `publish_scheduled_products()` function.
- [ ] `publish_scheduled_products()` flips `is_active=true`, sets `publish_at=null`, and bumps `updated_at` for every draft whose `publish_at <= NOW()`, returning the affected row count.
- [ ] Edge Function `publish-scheduled` calls the RPC (cron: `0 * * * *`) and writes one `sync_logs` row with `items_processed = <count>`.
- [ ] `Product` TypeScript type exposes `publish_at?: string | null`.
- [ ] `productUpdateSchema` (Zod) accepts `publish_at: ISO datetime | null` on PATCH.
- [ ] Product edit form shows "Schedule Publishing" section only when `is_active === false`; hidden otherwise.
- [ ] `<input type="datetime-local">` supplies the value; "Schedule" PATCHes with ISO string; "Publish Now" PATCHes with `is_active: true, publish_at: null`; "Clear schedule" PATCHes with `publish_at: null`.
- [ ] Dashboard widget lists the next ≤10 scheduled drafts, ordered by `publish_at ASC`, with product name, relative + absolute time, and edit link. Shows an empty state if none.

### Quality Gates
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx eslint . --max-warnings 0` → 0 warnings
- [ ] `npx vitest run` → previous 307 + new tests all green

---

## File Structure

```
plan/
└── phase-9/
    ├── PHASE_9_PLAN.md              ← this file
    ├── features/
    │   ├── F9.1-asin-import.md
    │   └── F9.2-scheduled-publishing.md
    └── tests/
        └── TEST_MATRIX.md

supabase/
├── migrations/
│   └── 00008_product_scheduling.sql    (new)
└── functions/
    ├── import-product/index.ts         (new)
    └── publish-scheduled/index.ts      (new)

src/
├── types/domain.ts                     (+publish_at)
├── app/
│   └── admin/
│       ├── (dashboard)/page.tsx        (+ widgets)
│       ├── _components/
│       │   ├── dashboard/
│       │   │   ├── AsinImportWidget.tsx         (new, client)
│       │   │   └── ScheduledPublishWidget.tsx   (new, server)
│       │   └── __tests__/
│       │       ├── AsinImportWidget.test.tsx           (new)
│       │       └── ScheduledPublishWidget.test.tsx     (new)
│       ├── _lib/
│       │   ├── queries/dashboard.ts    (+ getScheduledProducts)
│       │   └── schemas/product.ts      (+ publish_at)
│       ├── api/
│       │   ├── products/
│       │   │   ├── import/route.ts     (new, POST)
│       │   │   └── __tests__/import.test.ts  (new)
│       │   └── __tests__/products.test.ts    (+ publish_at cases)
│       └── products/[id]/
│           └── _components/
│               ├── ProductEditForm.tsx                (+ scheduler section)
│               ├── PublishScheduler.tsx               (new, client)
│               └── __tests__/PublishScheduler.test.tsx (new)
```

---

## Risk & Mitigation

| # | Risk | Mitigation |
|---|---|---|
| R9.1 | Amazon keys leak into Node.js bundle | Keys stay in Supabase Vault; the Next.js route only calls `supabase.functions.invoke`. |
| R9.2 | Race condition: operator flips `is_active` manually while scheduler runs | `publish_scheduled_products()` filters `WHERE is_active = FALSE` — manual activation simply removes the row from the candidate set. |
| R9.3 | Scheduler runs but cron secret missing | Edge Function rejects the request with 401 unless `Authorization: Bearer $CRON_SECRET` matches. |
| R9.4 | Operator schedules for the past | Migration allows it; scheduler will pick it up on the next tick, which is correct behaviour. |
| R9.5 | PA-API returns no item for ASIN | Route returns 404 with a descriptive error so the widget can surface "No product found on Amazon". |

---

## Implementation Order

1. Plan documents (this file + features + test matrix). ✅
2. Migration 00008 + domain type update + Zod schema update.
3. Edge Function `import-product` + admin API route + widget.
4. Edge Function `publish-scheduled` + `PublishScheduler` + widget.
5. Wire both widgets into the dashboard page.
6. Tests (component + API route).
7. Quality gates (`tsc`, `eslint`, `vitest`).
