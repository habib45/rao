# Phase 14 — Blog System (SEO-Driven)

**Status:** In Progress
**Dependencies:** Phases 1–11 complete (admin shell, auth, RichTextEditor, public layout, sitemap)

> Note: Although the user's brief referenced "Phase 12" filenames, Phase 12 already
> exists in this repository for the Product Review System. To avoid clobbering that
> plan we land the blog work as **Phase 14**. All migrations, types, queries, routes,
> and tests landed by this phase are listed below.

---

## Overview

Phase 14 introduces a full SEO-driven blog system to the storefront and admin panel:

1. **Public storefront** gains `/[locale]/blog`, `/[locale]/blog/[slug]`, `/[locale]/blog/category/[slug]` pages with ISR, JSON-LD, OG metadata, and sitemap entries.
2. **Admin panel** gains a Blog section with a TanStack-Query table, create/edit pages with the existing TipTap `RichTextEditor`, category/tag/comment management, and a comment moderation queue.
3. **Database** introduces six new tables — `blog_posts`, `blog_categories`, `blog_tags`, `blog_post_tags`, `blog_post_views`, `blog_comments` — all with RLS, indexes, triggers, and tsvector full-text search.
4. **Translations** — `title`, `slug`, `excerpt`, `meta_title`, `meta_description` are stored in JSONB `TranslationMap`s. **`content` is English-only** (TEXT) per user decision.

---

## Features

| # | Feature | Document |
|---|---|---|
| 14.1 | Database schema & RLS | [features/F14.1-database.md](features/F14.1-database.md) |
| 14.2 | Public blog UI | [features/F14.2-public-blog.md](features/F14.2-public-blog.md) |
| 14.3 | Admin blog UI | [features/F14.3-admin-blog.md](features/F14.3-admin-blog.md) |

Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Acceptance Criteria

- All six blog tables exist with documented columns, indexes, RLS, triggers.
- Public blog landing page lists 12 published posts/page, featured grid, trending sidebar.
- Public blog detail renders TipTap-authored HTML, breadcrumbs, related posts, comment form, and JSON-LD (`Article` + `BreadcrumbList`).
- Admin can create / edit / publish / archive / delete blog posts via API routes secured by `createAdminClient()`.
- Admin can moderate (approve/reject) comments.
- Sitemap includes blog landing + every published post (English slug + locale alternates).
- Header public navigation includes a Blog link in all three locales.
- Quality gates: `tsc --noEmit` 0 errors, `eslint --max-warnings 0` clean, `vitest run` baseline + new tests passing.
