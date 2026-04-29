# Phase 12 — Product Review System

**Status:** 📋 Planned
**Dependencies:** Phases 1–11 must be complete.

---

## Overview

Phase 12 adds a user-generated review system to the storefront:

1. **Shoppers** submit reviews (name, email, rating, title, body) from the product detail page.
2. **The submitter** sees their own pending review via a `reviewer_email` cookie until it is moderated.
3. **Admins** moderate pending reviews (approve / reject with optional admin note) through a new admin page.

Only approved reviews are publicly visible to everyone; the submitter additionally sees their own pending review thanks to the cookie claim.

---

## Features

| # | Feature | Document |
|---|---|---|
| 12.1 | Review Schema & RLS | [features/F12.1-review-schema.md](features/F12.1-review-schema.md) |
| 12.2 | Public Review UI | [features/F12.2-public-review-ui.md](features/F12.2-public-review-ui.md) |
| 12.3 | Admin Review Moderation | [features/F12.3-admin-moderation.md](features/F12.3-admin-moderation.md) |

Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Acceptance Criteria

- [ ] Migration `00010_product_reviews.sql` creates `product_reviews` table with check constraints + indexes.
- [ ] RLS: public INSERT; public SELECT where `status='approved'` OR `author_email = current_setting('request.jwt.claims', true)::json->>'reviewer_email'` (or equivalent via route-handled filter); admin full access.
- [ ] Public GET `/api/reviews/[productId]` returns approved reviews plus own pending reviews for the current cookie.
- [ ] Public POST `/api/reviews` accepts `{ product_id, author_name, author_email, rating, title?, body }`, validates via Zod, inserts `status='pending'`, sets a 1-year `reviewer_email` cookie.
- [ ] `ReviewSection` renders on the product detail page: list of approved reviews, star rating component, and the submit form.
- [ ] After a successful submission the UI shows the pending review with a "Pending approval" badge.
- [ ] Admin page `/admin/reviews` has Pending / Approved / Rejected tabs and a moderation table.
- [ ] Admin PATCH `/admin/api/reviews/[id]` updates `status` to `approved` or `rejected`, optionally writing `admin_note`.
- [ ] AdminShell sidebar shows "Reviews" link.

---

## File Structure

```
supabase/
└── migrations/
    └── 00010_product_reviews.sql                   ← new

src/
├── app/
│   ├── [locale]/products/[slug]/
│   │   ├── page.tsx                                ← updated to embed ReviewSection
│   │   └── _components/
│   │       └── ReviewSection.tsx                   ← new (client)
│   ├── api/reviews/
│   │   ├── route.ts                                ← new (POST)
│   │   └── [productId]/route.ts                    ← new (GET)
│   └── admin/
│       ├── _components/AdminShell.tsx              ← updated (Reviews link)
│       ├── _lib/schemas/review.ts                  ← new
│       ├── api/reviews/
│       │   ├── route.ts                            ← new (GET)
│       │   └── [id]/route.ts                       ← new (PATCH)
│       └── reviews/
│           ├── page.tsx                            ← new
│           └── _components/ReviewModerationTable.tsx ← new
└── types/domain.ts                                 ← updated (ProductReview)
```

---

## Quality Gates
- `npx tsc --noEmit` — 0 errors.
- `npx eslint . --max-warnings 0` — 0 warnings.
- `npx vitest run` — all prior tests plus new cases pass.
