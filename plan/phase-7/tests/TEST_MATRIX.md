# Phase 7 — Test Matrix

## Regression Test Run

All previous test matrices must pass without modification:
- Phase 1: F1.1–F1.5 (types, i18n, Supabase client)
- Phase 2: Schema validation (Zod)
- Phase 3: SigV4, transformers, utils
- Phase 4: ProductCard, SearchBar, query helpers
- Phase 5: cart storage, CartProvider
- Phase 6: sitemap, JSON-LD, metadata
- Phase 8: slugify, admin schemas, admin auth, StatsCard, ProductFilters, categories API, products API, middleware

## New Integration Tests

### `src/lib/queries/__tests__/products.test.ts`

| Test ID | Description | Expected |
|---|---|---|
| T7.1.1 | `getProducts` with sort=price_asc queries with correct order | `.order("price_cents", { ascending: true })` |
| T7.1.2 | `getProducts` with categoryId filters products | `.eq("category_id", ...)` called |
| T7.1.3 | `getProduct` returns null when not found | `null` |
| T7.1.4 | `getFeaturedProducts` limits to 8 | `.limit(8)` called |

### `src/lib/queries/__tests__/categories.test.ts`

| Test ID | Description | Expected |
|---|---|---|
| T7.2.1 | `getCategories` filters is_active=true | Correct filter |
| T7.2.2 | `getCategory` returns null for unknown slug | `null` |

## Security Checks (CI)

| Check | Tool | Expected |
|---|---|---|
| T7.3.1 | No AMAZON_SECRET_KEY in src/ | grep returns 0 matches |
| T7.3.2 | No service_role key in src/ | grep returns 0 matches |
| T7.3.3 | npm audit | 0 high/critical vulnerabilities |

## Quality Gates

| Gate | Command | Threshold |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| ESLint | `npx eslint . --max-warnings 0` | 0 warnings |
| Tests | `npx vitest run` | 0 failures |
| Test count | — | ≥ 307 passing |
