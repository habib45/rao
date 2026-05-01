# Phase 17 — Test Matrix

## Coverage Target: 100% of new code

---

## F17.1 — DB Migration (verified by API tests, not unit tested directly)

| # | Test | Expected |
|---|---|---|
| - | RLS blocks anon read of `sitemap_custom_entries` | Covered by API route tests using service-role vs anon client |

---

## F17.2 — `sitemap.ts` Modification

> Tested via integration: the preview API route uses the same logic. Unit tests mock Supabase.

| # | Test | Expected |
|---|---|---|
| S1 | Exclusion list empty → all products included | Full product list in entries |
| S2 | Slug `"old-slug"` in exclusions → product with that slug absent | Entry omitted |
| S3 | `sitemap_custom_entries` with `is_active=true` appended | Custom URL present |
| S4 | `sitemap_custom_entries` with `is_active=false` omitted | Custom URL absent |
| S5 | DB read failure for exclusions → fallback to empty list | No entries excluded |

**File:** `src/app/__tests__/sitemap.test.ts` (new)

---

## F17.3 — Schemas (`src/app/admin/_lib/schemas/sitemap.ts`)

| # | Test | Expected |
|---|---|---|
| SC1 | Valid custom entry → passes | No issues |
| SC2 | URL not starting with site URL → fails | `{ issues: [...] }` |
| SC3 | Priority < 0.1 → fails | Zod error on `priority` |
| SC4 | Priority > 1.0 → fails | Zod error on `priority` |
| SC5 | Invalid changefreq value → fails | Zod enum error |
| SC6 | Exclusion PATCH with neither add nor remove → fails | Zod refine error |
| SC7 | Robots rule with empty userAgent → fails | Zod min(1) error |
| SC8 | Valid robots config with 2 rules → passes | No issues |

**File:** `src/app/admin/_lib/__tests__/schemas.test.ts` (extend existing)

---

## F17.4 — API Routes

### `GET /admin/api/sitemap?action=custom`

| # | Test | Expected |
|---|---|---|
| A1 | No admin JWT → 401 | `{ error: "Unauthorized" }` |
| A2 | Valid admin, no entries → 200 empty list | `{ entries: [], total: 0 }` |
| A3 | Valid admin, 3 entries → 200 list | `{ entries: [...], total: 3 }` |

### `POST /admin/api/sitemap`

| # | Test | Expected |
|---|---|---|
| A4 | Invalid URL → 400 | `{ error: "Validation failed" }` |
| A5 | Valid body → 201 with created row | Created entry returned |
| A6 | Duplicate URL → 409 from DB unique constraint | `{ error: ... }` |

### `PATCH /admin/api/sitemap/exclusions`

| # | Test | Expected |
|---|---|---|
| A7 | Add slug to empty list → slug present | `{ slugs: ["slug"] }` |
| A8 | Remove slug from list → slug absent | `{ slugs: [] }` |
| A9 | Neither add nor remove → 400 | Zod refine error |

### `POST /admin/api/sitemap/revalidate`

| # | Test | Expected |
|---|---|---|
| A10 | No admin JWT → 401 | Unauthorized |
| A11 | Valid admin → 200 revalidated | `{ revalidated: true }` |

### `PATCH /admin/api/sitemap/robots`

| # | Test | Expected |
|---|---|---|
| A12 | Empty rules array → 400 | Zod min(1) error |
| A13 | Valid rules → 200 saved | Updated rules returned |

**File:** `src/app/admin/api/__tests__/sitemap.test.ts` (new)

---

## F17.5 — `robots.ts` Modification

| # | Test | Expected |
|---|---|---|
| R1 | DB has `robots_config` → rules applied | Output matches DB rules |
| R2 | DB missing `robots_config` → default rules used | Output matches `defaultRules` |
| R3 | sitemap URL always present | `sitemap` field always set |

**File:** `src/app/__tests__/robots.test.ts` (new)

---

## F17.6 — UI Components

### `RegenerateButton.tsx`

| # | Test | Expected |
|---|---|---|
| U1 | Renders "Force Regenerate Sitemap" button | Button present |
| U2 | Click → POST to `/admin/api/sitemap/revalidate` | Fetch called |
| U3 | Success response → success toast shown | `sonner` toast fired |
| U4 | Error response → error toast shown | Error toast fired |

### `CustomEntriesPanel.tsx`

| # | Test | Expected |
|---|---|---|
| U5 | Renders list of entries from API | Table rows present |
| U6 | "Add Custom URL" shows form | Form visible |
| U7 | Submit valid form → POST called | Mutation fires |
| U8 | Submit invalid URL → validation error shown | Error message present |

### `ExclusionsPanel.tsx`

| # | Test | Expected |
|---|---|---|
| U9 | Renders chips for each exclusion slug | Chip per slug |
| U10 | Remove chip → DELETE called | Mutation fires |
| U11 | Add slug → POST called | Mutation fires |

**File:** `src/app/admin/sitemap/_components/__tests__/*.test.tsx` (new)

---

## Summary

| Category | Test Count |
|---|---|
| sitemap.ts logic | 5 |
| robots.ts logic | 3 |
| Schemas | 8 |
| API routes | 13 |
| UI components | 11 |
| **Total new tests** | **40** |
| **Expected new baseline** | **332 + 40 = 372** |

---

## Quality Gate Commands

```bash
npx tsc --noEmit
npx eslint . --max-warnings 0
npx vitest run
```

All must pass before Phase 17 is marked complete.
