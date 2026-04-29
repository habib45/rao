# Phase 10 — Public UI Redesign

**Status:** ✅ Complete (implemented prior to documentation sweep; this plan documents the delivered work retrospectively).
**Dependencies:** Phases 1–9 must be complete.
**Baseline at start:** 307+ tests passing, 0 TypeScript errors, 0 ESLint warnings.

---

## Overview

Phase 10 replaces the first-cut storefront visuals with a production-grade redesign of:

- the **public homepage** (`/[locale]`)
- the **product listing page** (`/[locale]/products`)
- the shared **Header** and **Footer**
- the reusable **ProductCard** and product-list sub-components

No database or API changes. All work is in `src/app/[locale]/`, `src/components/`, `src/lib/queries/products.ts`, and `src/types/domain.ts` (minor type adjustments for filter metadata).

The redesign keeps ISR (`export const revalidate = 3600`), keeps `generateMetadata`/`generateStaticParams` on all public pages, keeps `next/image` with explicit dimensions, and reuses the existing next-intl translation pipeline (`en`, `bn-BD`, `sv`).

---

## Deliverables

### Pages
- `src/app/[locale]/page.tsx` — redesigned homepage (hero, category icon grid, featured + deals sections)
- `src/app/[locale]/products/page.tsx` — redesigned listing with sidebar filters, sort control, pagination
- `src/app/[locale]/categories/[slug]/page.tsx` — refreshed to consume the new card/grid primitives

### Shared Components
- `src/components/Header.tsx` — site header (logo, nav, locale switcher, cart badge)
- `src/components/Footer.tsx` — footer with legal/affiliate disclosure, locale-aware links
- `src/components/ProductCard.tsx` — reusable product card (image, rating, price, discount badge, CTA)

### Product List Sub-components
- `src/app/[locale]/products/_components/SidebarFilters.tsx` — category, price range, rating, availability
- `src/app/[locale]/products/_components/SortSelect.tsx` — sort by recent/price/rating
- `src/app/[locale]/products/_components/Pagination.tsx` — server-driven page links, preserves search params

### Query Helpers
- `src/lib/queries/products.ts`:
  - `getProductsFiltered(options)` — paginated + filtered list for the listing page
  - `getProductFilterMeta()` — categories + price range + rating distribution for the sidebar
  - `getProductsByCategoryLimit(categoryId, limit)` — featured slice for homepage sections

---

## Acceptance Criteria

- [x] Homepage hero renders translated headings for all 3 locales.
- [x] Category icon grid is responsive (2 / 3 / 4 columns breakpoints).
- [x] Featured section and deals section each load via `getProductsByCategoryLimit` with ISR.
- [x] Product list page reads filters + sort + page from `searchParams` and passes them to `getProductsFiltered`.
- [x] Sidebar filters support category, price range, rating, availability.
- [x] `SortSelect` preserves other search params when changing sort.
- [x] `Pagination` preserves search params when changing page.
- [x] `ProductCard` shows image (`next/image`), name (locale-aware), price (`formatPrice`), discount badge when `discount_pct > 0`, and rating stars.
- [x] Header includes cart badge driven by existing `CartProvider`.
- [x] Footer includes "As an Amazon Associate, we earn from qualifying purchases" disclosure.
- [x] All public pages still pass ISR (`revalidate=3600`) and emit `generateMetadata`.
- [x] TypeScript: 0 errors. ESLint: 0 warnings. Vitest: all existing tests pass.

---

## File Structure

```
src/
├── app/
│   └── [locale]/
│       ├── page.tsx                              ← redesigned
│       ├── products/
│       │   ├── page.tsx                           ← redesigned
│       │   └── _components/
│       │       ├── SidebarFilters.tsx             ← new
│       │       ├── SortSelect.tsx                 ← new
│       │       └── Pagination.tsx                 ← new
│       └── categories/[slug]/page.tsx             ← updated to use shared card
├── components/
│   ├── Header.tsx                                 ← new
│   ├── Footer.tsx                                 ← new
│   └── ProductCard.tsx                            ← new
└── lib/queries/products.ts                        ← added getProductsFiltered,
                                                     getProductFilterMeta,
                                                     getProductsByCategoryLimit
```

---

## Why There Is No `features/` or `tests/TEST_MATRIX.md` Folder

Phase 10 shipped before the documentation sweep, so no feature docs or per-feature test matrix were authored at implementation time. The existing Vitest suite (components, query helpers) already exercises the new code, and the quality gates (tsc, eslint, vitest) were enforced on the redesign branch.

Future visual regressions should be caught by:
- snapshot tests on `ProductCard`
- integration tests on `getProductsFiltered` / `getProductFilterMeta`
- manual Lighthouse audits per locale

---

## Dependencies on Later Phases

Phase 11 (product creation form) reuses `ProductCard` and the filter query helpers when previewing drafts. Phase 12 (reviews) integrates into the product detail page that this phase refreshed. Phase 13 (media manager) feeds images that this phase's `ProductCard` renders via `next/image`.
