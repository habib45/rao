# Phase 16 — Related Content Sections (Blog & Product Detail Pages)

**Status:** Planned  
**Dependencies:** Phase 14 (blog system), Phase 10 (ProductCard, public layout)

---

## Overview

Phase 16 adds **Related Content** sections to two detail pages:

1. **Blog detail page** (`/[locale]/blog/[slug]`) — a full-width "More from this category" grid rendered **below** the comments section, showing up to 3 related published posts from the same blog category (excluding the current post).

2. **Product detail page** (`/[locale]/products/[slug]`) — a full-width "You may also like" grid rendered **below** the main product layout, showing up to 4 related active products from the same category (excluding the current product), using the existing `ProductCard` component.

Both sections are server-rendered (ISR), localized, and gracefully hidden when no related content is available.

---

## Features

| # | Feature | Document |
|---|---|---|
| 16.1 | Related Blog Posts section on blog detail page | [features/F16.1-related-blogs.md](features/F16.1-related-blogs.md) |
| 16.2 | `getRelatedProducts()` query helper | [features/F16.2-related-products-query.md](features/F16.2-related-products-query.md) |
| 16.3 | Related Products section on product detail page | [features/F16.3-related-products-ui.md](features/F16.3-related-products-ui.md) |

Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Acceptance Criteria

- Blog detail page shows a "More from [Category Name]" section **below** the comments section when ≥1 related published post exists in the same category.
- Blog related section renders up to 3 posts as cards with cover image, title (localized), category badge, date, and read-time. Hidden when no related posts.
- Product detail page shows a "You may also like" section **below** the main two-column layout when ≥1 related active product exists in the same category.
- Product related section renders up to 4 products using the existing `ProductCard` component. Hidden when no related products.
- `getRelatedProducts(productId, categoryId, limit)` added to `src/lib/queries/products.ts` — filters `is_active=true`, excludes current product, orders by `created_at desc`, returns `Product[]`.
- All sections are server-rendered (no extra client JS).
- Quality gates: `tsc --noEmit` 0 errors | `eslint --max-warnings 0` | all existing tests pass + new tests pass.

---

## File Changes

### Modified files
| File | Change |
|---|---|
| `src/app/[locale]/blog/[slug]/page.tsx` | Add `RelatedBlogPosts` section below comments |
| `src/app/[locale]/products/[slug]/page.tsx` | Add `RelatedProducts` section below main layout |
| `src/lib/queries/products.ts` | Add `getRelatedProducts()` |

### No new migrations needed
No database changes — uses existing tables and queries.

---

## Implementation Order

1. **F16.2** — Add `getRelatedProducts()` to `products.ts` (no UI)
2. **F16.1** — Add related blog posts section to blog detail page (query already exists)
3. **F16.3** — Add related products section to product detail page (uses new query + existing `ProductCard`)
