# Phase 9 — Test Matrix

All tests use Vitest + jsdom + @testing-library/react, following the patterns already established in Phase 8.

---

## T9.1 — `src/app/admin/api/products/__tests__/import.test.ts`

Target: `POST /admin/api/products/import`

| # | Case | Expected |
|---|---|---|
| 1 | POST with valid ASIN and Edge Function returns a product item | 201, body includes `product_id`, `asin`, `name` |
| 2 | POST with ASIN that is too short (`"ABC"`) | 400 `{ error: "Validation failed" }` |
| 3 | POST with ASIN that is too long (`"ABCDEFGHIJK"`) | 400 `{ error: "Validation failed" }` |
| 4 | POST with ASIN containing lowercase / symbols | 400 |
| 5 | Edge Function returns `error: { message: "PA-API 503" }` | 502 `{ error: /Amazon import failed/ }` |
| 6 | Edge Function returns `data: { item: null }` (ASIN not on Amazon) | 502 `{ error: /not found on Amazon/ }` |
| 7 | Existing product with same ASIN → upsert path | 201, `supabase.from('products').upsert` called with `onConflict: "asin"` |
| 8 | PA-API item has a primary image → upsert into `product_images` | 201 and image upsert recorded |

Mocks: stub `createAdminClient` (shared `makeSupabaseStub` pattern), stub `supabase.functions.invoke` via the stub.

---

## T9.2 — `src/app/admin/_components/__tests__/AsinImportWidget.test.tsx`

Target: `AsinImportWidget`

| # | Case | Expected |
|---|---|---|
| 1 | Renders input with placeholder "ASIN" and disabled "Sync" button when empty | both present, button `disabled` |
| 2 | Typing a 10-char uppercase ASIN enables the button | button not `disabled` |
| 3 | Typing a short ASIN keeps the button disabled | `disabled` remains |
| 4 | Clicking Sync while fetching shows "Syncing…" and disables button | text change, `disabled` |
| 5 | Successful fetch shows success banner with product name and edit link | link href = `/admin/products/<id>` |
| 6 | Failed fetch (JSON `error`) shows red banner with message | text visible |

Mocks: `global.fetch` via `vi.stubGlobal`.

---

## T9.3 — `src/app/admin/_components/__tests__/ScheduledPublishWidget.test.tsx`

Target: `ScheduledPublishWidget`

| # | Case | Expected |
|---|---|---|
| 1 | Renders the list of scheduled drafts | product names + "Edit" link visible |
| 2 | Empty list renders empty state "No products currently scheduled." | string visible |
| 3 | Formats the scheduled date (absolute date string present) | text matches ISO date component |

This widget is a server component but accepts `products` as a prop so we can render it synchronously in a test (the async data fetching is exercised at the query-layer test level).

---

## T9.4 — `src/app/admin/products/[id]/_components/__tests__/PublishScheduler.test.tsx`

Target: `PublishScheduler`

| # | Case | Expected |
|---|---|---|
| 1 | Renders datetime input + Schedule button | elements present |
| 2 | "Schedule" button is disabled when the datetime field is empty | `disabled` |
| 3 | Submitting "Schedule" calls PATCH with `publish_at` in body | fetch called with matching body |
| 4 | "Publish Now" PATCHes `{ is_active: true, publish_at: null }` | fetch body matches |
| 5 | When `currentPublishAt` is provided, "Clear schedule" button appears; clicking PATCHes `{ publish_at: null }` | fetch body matches |

Mocks: `global.fetch`; `next/navigation` router.refresh stubbed via `vi.mock("next/navigation", ...)`.

---

## T9.5 — `src/app/admin/api/__tests__/products.test.ts` (additions)

Extend the existing test file with:

| # | Case | Expected |
|---|---|---|
| A | PATCH body `{ publish_at: "2099-12-31T00:00:00.000Z" }` | 200 |
| B | PATCH body `{ publish_at: null }` | 200 |
| C | PATCH body `{ publish_at: "not-a-date" }` | 400 |

No change to existing cases; these sit alongside the prior PATCH describe block.

---

## Quality Gates

```bash
npx tsc --noEmit                # 0 errors
npx eslint . --max-warnings 0   # 0 warnings
npx vitest run                  # 307 prior + ~18 new cases, all green
```

---

## Notes

- Edge Functions live in Deno and are not bundled into the Vitest graph; there is no unit test for them at this phase (consistent with Phase 3).
- The `publish_scheduled_products()` SQL function is tested implicitly through the cron Edge Function's contract (the route either reports `items_processed` from the RPC return value or logs an error). A DB-level integration test is out of scope for this phase.
