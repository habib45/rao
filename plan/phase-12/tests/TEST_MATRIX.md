# Phase 12 — Test Matrix

| # | File | Case | Assertion |
|---|---|---|---|
| 1 | `src/app/[locale]/products/[slug]/_components/__tests__/ReviewSection.test.tsx` | Renders approved reviews | Given two approved reviews, both appear with stars and titles. |
| 2 | same | Hides rejected reviews | Response containing a rejected review does not render it. |
| 3 | same | Submit form shows pending badge on success | After POST 201, the new review is prepended with the "Pending approval" label. |
| 4 | same | Validation: body too short | Typing body with <10 chars and submitting surfaces inline error. |
| 5 | `src/app/api/reviews/__tests__/post.test.ts` | 400 on invalid body | Missing required fields → 400 with Zod issues. |
| 6 | same | 201 sets cookie + inserts | Valid body returns 201, insert called, cookie `reviewer_email` in Set-Cookie header. |
| 7 | `src/app/api/reviews/[productId]/__tests__/get.test.ts` | Returns approved only without cookie | Without cookie, `.eq('status','approved')` filter is applied. |
| 8 | same | Includes own pending when cookie present | With cookie, `.or(...)` includes `author_email.eq.<cookie>`. |
| 9 | `src/app/admin/api/reviews/__tests__/get.test.ts` | Filters by status param | `?status=rejected` adds `.eq('status','rejected')`. |
| 10 | same | Paginates | `?page=2&pageSize=10` offsets by 10. |
| 11 | `src/app/admin/api/reviews/[id]/__tests__/patch.test.ts` | 400 on invalid status | `{ status: 'foo' }` returns 400. |
| 12 | same | 200 on approve | `{ status: 'approved' }` updates status. |
| 13 | same | Stores admin_note when provided | Body includes `admin_note`; insert call receives it. |
| 14 | `src/app/admin/reviews/_components/__tests__/ReviewModerationTable.test.tsx` | Renders rows | Given two reviews, both rows + Approve/Reject buttons render. |
| 15 | same | Reject dialog sends PATCH | Clicking Reject + Confirm fires PATCH with `status: 'rejected'`. |

## Quality Gates
- `npx tsc --noEmit` — 0 errors.
- `npx eslint . --max-warnings 0` — 0 warnings.
- `npx vitest run` — all prior tests plus these new ones pass.
