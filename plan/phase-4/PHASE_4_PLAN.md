# Phase 4 — Core Pages & Components

## Objective

Build all App Router pages and reusable UI components for the public storefront. Every page uses ISR (Incremental Static Regeneration) for fast initial loads and fresh data. All 3 locales (en, bn-BD, sv) are supported with hreflang alternates and locale-specific metadata.

---

## Feature List

| ID | Feature | Priority | Complexity | Document |
|---|---|---|---|---|
| F4.1 | Shared UI Components | P0 | Medium | [features/F4.1-shared-components.md](features/F4.1-shared-components.md) |
| F4.2 | Homepage | P0 | Medium | [features/F4.2-homepage.md](features/F4.2-homepage.md) |
| F4.3 | Product Listing Page | P0 | High | [features/F4.3-product-listing.md](features/F4.3-product-listing.md) |
| F4.4 | Product Detail Page | P0 | High | [features/F4.4-product-detail.md](features/F4.4-product-detail.md) |
| F4.5 | Category Pages | P0 | Medium | [features/F4.5-category-pages.md](features/F4.5-category-pages.md) |
| F4.6 | Search Page | P1 | Medium | [features/F4.6-search-page.md](features/F4.6-search-page.md) |
| F4.7 | Data Query Helpers | P0 | Medium | [features/F4.7-query-helpers.md](features/F4.7-query-helpers.md) |

---

## Dependency Order

```
F4.7 (Query helpers)
 ├── F4.2 (Homepage)          ← needs getProducts, getCategories
 ├── F4.3 (Product Listing)   ← needs getProducts with filters
 ├── F4.4 (Product Detail)    ← needs getProduct(slug)
 ├── F4.5 (Category Pages)    ← needs getCategory(slug) + products
 └── F4.6 (Search Page)       ← needs search-products Edge Function
F4.1 (Shared Components)      ← used by all pages above
```

**Implementation order:** F4.1 → F4.7 → F4.2 → F4.3 → F4.4 → F4.5 → F4.6

---

## Acceptance Criteria (Phase 4 Complete When)

- [ ] `/en`, `/bn-BD`, `/sv` each render the homepage without errors
- [ ] `/en/products` lists paginated products with working filters
- [ ] `/en/products/[slug]` renders product detail with JSON-LD
- [ ] `/en/categories/[slug]` renders filtered product list
- [ ] `/en/search?q=laptop` shows results
- [ ] All pages have `generateMetadata` with hreflang alternates
- [ ] `generateStaticParams` covers all product/category slugs
- [ ] ISR `revalidate = 3600` on all data-fetching pages
- [ ] No `<img>` tags — all images via `next/image`
- [ ] Skeleton loading states for all dynamic content
- [ ] `npx tsc --noEmit` passes with zero errors

---

## Test Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | Query helpers, transformer functions |
| Component tests | Vitest + Testing Library | ProductCard, CategoryCard, Header, SearchBar |
| Page render tests | Vitest + Testing Library | Homepage, ProductListing with mock data |
| Snapshot tests | Vitest | JSON-LD output, metadata shape |

---

## File Structure After Phase 4

```
src/
├── app/[locale]/
│   ├── page.tsx                     ← F4.2 homepage
│   ├── loading.tsx                  ← Suspense skeleton
│   ├── not-found.tsx                ← 404 page
│   ├── products/
│   │   ├── page.tsx                 ← F4.3 product listing
│   │   └── [slug]/
│   │       └── page.tsx             ← F4.4 product detail
│   ├── categories/
│   │   ├── page.tsx                 ← F4.5 category listing
│   │   └── [slug]/
│   │       └── page.tsx             ← F4.5 category detail
│   └── search/
│       └── page.tsx                 ← F4.6 search results
├── components/
│   ├── Header.tsx                   ← F4.1
│   ├── Footer.tsx                   ← F4.1
│   ├── ProductCard.tsx              ← F4.1
│   ├── ProductCardSkeleton.tsx      ← F4.1
│   ├── CategoryCard.tsx             ← F4.1
│   ├── SearchBar.tsx                ← F4.1
│   └── AddToCartButton.tsx          ← F4.1 (wired in Phase 5)
└── lib/queries/
    ├── products.ts                  ← F4.7
    └── categories.ts                ← F4.7
```
