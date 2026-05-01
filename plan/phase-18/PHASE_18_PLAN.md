# Phase 18 — Blog Enhancements: Pagination, Filtering, Newsletter & Comment Management

**Status:** In Progress  
**Dependencies:** Phase 14 (blog system in place — tables, public pages, admin shell)

---

## Overview

Phase 18 extends the existing blog system with three focused enhancements:

1. **Blog Pagination & Filtering** — replace the hardcoded 12-post page size with user-selectable per-page options (20 / 50 / 100) and add server-side filtering by category and keyword search.
2. **Newsletter Subscription System** — a `newsletter_subscribers` table, a public subscription form on the blog page, and an admin panel for configuring the section and managing subscribers.
3. **Admin Blog Comment Management** — a moderation queue at `/admin/blog/comments` where admins can approve, hide, or delete comments on any post.

---

## Features

| # | Feature | Document |
|---|---|---|
| 18.1 | Blog pagination options + filtering | [features/F18.1-pagination-filtering.md](features/F18.1-pagination-filtering.md) |
| 18.2 | Newsletter subscription system | [features/F18.2-newsletter.md](features/F18.2-newsletter.md) |
| 18.3 | Admin blog comment management | [features/F18.3-comment-management.md](features/F18.3-comment-management.md) |

Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Acceptance Criteria

- Blog listing page supports `?perPage=20|50|100` query param with a visible per-page selector UI.
- Blog listing page supports `?category=<slug>` and `?q=<text>` filters; active filters shown and clearable.
- Newsletter section renders on the blog listing page; visibility, title, and subtitle are configurable from admin settings.
- Subscriptions are written to `newsletter_subscribers` (deduped by email); admin can list/export/deactivate subscribers.
- `/admin/blog/comments` lists all comments across all posts with status filter (pending / approved / all) and per-post filter.
- Each comment row has Approve / Hide toggle and Delete action.
- Quality gates: `tsc --noEmit` 0 errors, `eslint --max-warnings 0`, `vitest run` baseline + new tests passing.

---

## New Migrations

- `supabase/migrations/00014_newsletter.sql` — `newsletter_subscribers` table + RLS

---

## New API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/newsletter/subscribe` | POST | Public subscribe (Zod-validated) |
| `/admin/api/newsletter/subscribers` | GET | Paginated subscriber list |
| `/admin/api/newsletter/settings` | GET / PATCH | Read/write newsletter section settings from `admin_settings` |
| `/admin/api/blog/comments` | GET | Paginated comment list with filters |
| `/admin/api/blog/comments/[id]` | PATCH / DELETE | Approve/hide/delete single comment |

---

## New/Modified Files

```
supabase/migrations/
  00014_newsletter.sql

src/
  lib/queries/
    blog.ts              ← add categoryId + search params to getPublishedBlogPosts / Count
    newsletter.ts        ← getNewsletterSettings, createSubscriber

  app/
    api/newsletter/subscribe/route.ts

    [locale]/blog/
      page.tsx           ← per-page selector + filter params + newsletter section

    admin/
      api/
        newsletter/subscribers/route.ts
        newsletter/settings/route.ts
        blog/comments/route.ts
        blog/comments/[id]/route.ts
      blog/
        comments/page.tsx
        comments/_components/CommentsTable.tsx
      newsletter/
        page.tsx
        _components/SubscribersTable.tsx
        _components/NewsletterSettingsForm.tsx
      _components/AdminShell.tsx   ← add "Comments" and "Newsletter" sidebar links
```
