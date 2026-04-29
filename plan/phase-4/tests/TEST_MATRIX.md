# Phase 4 — Test Matrix

## Component Tests (`src/components/__tests__/`)

### ProductCard.test.tsx

| Test ID | Description | Expected |
|---|---|---|
| T4.1.1 | Renders product name | Name text in document |
| T4.1.2 | Renders formatted price | "$29.99" for 2999 cents USD |
| T4.1.3 | Shows "—" when price_cents is null | Dash character rendered |
| T4.1.4 | Shows "Out of Stock" badge when unavailable | Badge visible |
| T4.1.5 | Image rendered with next/image | `<img>` with correct src |
| T4.1.6 | Renders rating with review count | "4.5 (123)" format |
| T4.1.7 | Missing primary image shows placeholder | No broken image |

### SearchBar.test.tsx

| Test ID | Description | Expected |
|---|---|---|
| T4.2.1 | Renders input with placeholder | Correct placeholder text |
| T4.2.2 | Typing triggers navigation after 300ms | router.push called |
| T4.2.3 | Typing < 300ms does not navigate | router.push not called |
| T4.2.4 | Submit with empty string does not navigate | router.push not called |

## Query Helper Tests (`src/lib/queries/__tests__/`)

### products.test.ts (mocked Supabase)

| Test ID | Description | Expected |
|---|---|---|
| T4.3.1 | `getProduct` returns null for unknown slug | null |
| T4.3.2 | `getProducts` passes correct page/offset to query | Correct params |
| T4.3.3 | `getFeaturedProducts` filters is_featured=true | Correct filter |
| T4.3.4 | `getAllProductSlugs` returns flat slug array | Correct shape |

### categories.test.ts (mocked Supabase)

| Test ID | Description | Expected |
|---|---|---|
| T4.4.1 | `getCategory` returns null for unknown slug | null |
| T4.4.2 | `getCategories` filters is_active=true | Correct filter |
| T4.4.3 | `getAllCategorySlugs` returns locale/slug pairs | Correct shape |
