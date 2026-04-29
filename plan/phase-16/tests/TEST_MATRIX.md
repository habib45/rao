# Phase 16 — Test Matrix

## F16.2 — `getRelatedProducts()` unit tests
File: `src/lib/queries/__tests__/relatedProducts.test.ts`

| # | Test case | Expected |
|---|---|---|
| 1 | `categoryId` is null → returns `[]` without querying Supabase | `[]` |
| 2 | Supabase returns matching products → returns typed `Product[]` | array of products |
| 3 | Supabase returns error → logs error, returns `[]` | `[]` |
| 4 | Result excludes the product with `productId` (`.neq` called with correct args) | Supabase `.neq("id", productId)` called |
| 5 | Respects `limit` argument (`.limit(limit)` called) | `.limit(4)` called |

## F16.1 — Related blog posts section (integration / render test)
File: `src/app/[locale]/blog/[slug]/_components/__tests__/RelatedBlogCard.test.tsx`
(Tests the `RelatedBlogCard` inline component extracted for testability, if extracted; otherwise test via page render)

| # | Test case | Expected |
|---|---|---|
| 6 | Renders post title (localized) | title text visible |
| 7 | Renders cover image via `next/image` (not raw `<img>`) | `Image` component renders with correct src |
| 8 | Renders category badge with correct color | badge with bg style |
| 9 | Link href = `/blog/[localized-slug]` | anchor href correct |
| 10 | Renders date and read time when present | date string and "min read" visible |

## F16.3 — Related products section (page render test)
File: `src/app/[locale]/products/[slug]/__tests__/relatedProducts.test.tsx`

| # | Test case | Expected |
|---|---|---|
| 11 | Section renders when `getRelatedProducts` returns products | section heading visible |
| 12 | Section hidden when `getRelatedProducts` returns `[]` | heading not rendered |
| 13 | Each product renders via `ProductCard` | `ProductCard` called for each related item |
| 14 | `showPrice` prop forwarded correctly to `ProductCard` | `showPrice` matches settings value |

---

## Quality Gates
```bash
npx tsc --noEmit           # 0 errors
npx eslint . --max-warnings 0   # 0 warnings
npx vitest run             # all existing tests + 14 new tests pass
```
