# Phase 11 — Test Matrix

Every row is a Vitest test case. Existing tests must remain green. Target: grow the suite by ~20 cases.

| # | File | Case | Assertion |
|---|---|---|---|
| 1 | `src/app/admin/_components/ui/__tests__/RichTextEditor.test.tsx` | Renders toolbar buttons | Bold, Italic, Underline, Strike, H1, H2, H3, bullet list, ordered list, table, link, image, align-left, align-center, align-right, color, highlight, undo, redo are all in the document. |
| 2 | same | Bold toggle updates HTML | Clicking Bold then typing produces `<strong>` in the onChange payload. |
| 3 | same | Accepts initial HTML | Mounting with `value="<p>hi</p>"` renders "hi" in the editable area. |
| 4 | same | onChange fires on content change | `onChange` is called with an HTML string containing typed characters. |
| 5 | `src/app/admin/products/new/_components/__tests__/ProductCreateForm.test.tsx` | Renders all tabs | Tab labels "General", "English", "Bangla", "Swedish", "Features", "Pricing", "Images", "SEO" all present. |
| 6 | same | Save as Draft posts product_status=draft | Submit calls fetch to products endpoint with body including `product_status: 'draft'`. |
| 7 | same | Submit for Review posts product_status=pending_review | Submit calls fetch with `product_status: 'pending_review'`. |
| 8 | same | ASIN import fills English title | When import API resolves with `{ name: { en: 'Widget' } }`, the English Title input receives "Widget". |
| 9 | same | Validation error highlights ASIN field | 400 response from import API surfaces inline error. |
| 10 | `src/app/admin/api/products/[id]/__tests__/approve.test.ts` | 200 on approve from pending | Given a product with `product_status='pending_review'`, POST returns 200 and updates to `approved`. |
| 11 | same | 409 when not pending | Given `product_status='draft'`, POST returns 409. |
| 12 | `src/app/admin/api/products/[id]/__tests__/reject.test.ts` | 400 on missing reason | POST with empty body returns 400 Zod error. |
| 13 | same | 200 on valid reject | POST with `{ reason: 'too thin' }` sets `product_status='draft'` and `rejection_reason='too thin'`. |
| 14 | `src/app/admin/api/products/[id]/__tests__/publish.test.ts` | 200 on publish from approved | POST updates `product_status='published'`, `is_active=true`. |
| 15 | same | 409 when not approved | POST returns 409 if current status is `draft`. |
| 16 | `src/app/admin/api/__tests__/products.test.ts` (extend) | PATCH accepts product_status | Patch body with `product_status='pending_review'` passes Zod + updates. |
| 17 | `src/app/admin/products/review/_components/__tests__/ReviewQueueTable.test.tsx` | Renders pending rows | Given two pending products, both names visible plus Approve/Reject buttons. |
| 18 | same | Reject dialog requires reason | Clicking Reject opens a dialog; submit is disabled until reason has >=5 chars. |
| 19 | `src/app/admin/_components/__tests__/AdminShell.test.tsx` (new) | Shows Review Queue badge | When `pendingCount=3`, badge renders "3". |
| 20 | same | Hides badge when count is 0 | Badge not rendered when `pendingCount=0`. |

## Supporting Stubs
- Supabase stubs must be thenable (`then(resolve, reject)`).
- `next/dynamic` mocked in tests that import the rich editor to render a plain `<textarea>` substitute.
- `vi.hoisted()` for shared mocks.
- `server-only` aliased via the existing vitest `alias` config.

## Quality Gates
- `npx tsc --noEmit` — 0 errors.
- `npx eslint . --max-warnings 0` — 0 warnings.
- `npx vitest run` — all prior suites plus these new cases pass.
