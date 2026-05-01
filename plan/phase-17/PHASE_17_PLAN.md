# Phase 17 — Admin Sitemap Management

## Goal

Give admins full visibility and control over the sitemap and robots.txt from inside the admin panel — without requiring a redeploy. The existing `src/app/sitemap.ts` is a live dynamic Next.js route (no `revalidate` export), so all DB changes are reflected on the next request automatically. This phase adds manual entry management, URL exclusions, robots.txt editing, and an in-panel preview/regenerate capability.

---

## Why No Redeploy Is Needed

`src/app/sitemap.ts` has no `export const revalidate` — Next.js treats it as a fully dynamic route and queries Supabase on every `/sitemap.xml` request. Adding, editing, or excluding DB rows is immediately reflected. The "Regenerate" button will:
1. Optionally set `export const revalidate = 3600` on the sitemap (caching for production performance)
2. Call `revalidatePath('/sitemap.xml', 'page')` via a server action to purge any cached version instantly

---

## Features

| # | Feature | File(s) |
|---|---|---|
| 17.1 | Sitemap DB Config (custom entries + exclusions) | migration `00011_sitemap_config.sql` |
| 17.2 | Modify `sitemap.ts` to read DB overrides | `src/app/sitemap.ts` |
| 17.3 | Admin Sitemap Management Page | `src/app/admin/sitemap/page.tsx` |
| 17.4 | Sitemap API Routes | `src/app/admin/api/sitemap/route.ts`, `revalidate/route.ts` |
| 17.5 | Robots.txt Management | `src/app/robots.ts` (modified), `admin/api/sitemap/robots/route.ts` |
| 17.6 | AdminShell nav entry | `AdminShell.tsx` |

---

## Acceptance Criteria

- [ ] Admin can view all current sitemap entries (auto-generated + custom) in a paginated table
- [ ] Admin can add custom URLs with priority, changefreq, and lastmod
- [ ] Admin can exclude any product/category/blog slug from the sitemap
- [ ] Admin can edit robots.txt allow/disallow rules, stored in `admin_settings`
- [ ] "Force Regenerate" button purges the sitemap ISR cache via `revalidatePath`
- [ ] Public `/sitemap.xml` reflects DB changes on the next request (no rebuild)
- [ ] Public `/robots.txt` references the correct sitemap URL and respects admin rules
- [ ] All new API routes are Zod-validated, service-role, and return proper error responses
- [ ] Quality gates pass: `tsc --noEmit` 0 errors, `eslint --max-warnings 0`, all tests passing

---

## File Structure

```
supabase/migrations/
  00011_sitemap_config.sql         ← new table + admin_settings seed rows

src/app/
  sitemap.ts                       ← modified to read custom entries + exclusions
  robots.ts                        ← modified to read rules from admin_settings

src/app/admin/
  sitemap/
    page.tsx                       ← server component shell
    _components/
      SitemapPreviewTable.tsx      ← paginated list of all generated entries
      CustomEntriesPanel.tsx       ← CRUD for custom URLs (client)
      ExclusionsPanel.tsx          ← manage slug exclusion list (client)
      RobotsEditor.tsx             ← edit robots rules (client)
      RegenerateButton.tsx         ← fires revalidatePath server action (client)
  api/
    sitemap/
      route.ts                     ← GET custom entries + exclusions, POST/DELETE custom entry
      exclusions/
        route.ts                   ← GET exclusions list, PATCH (add/remove)
      revalidate/
        route.ts                   ← POST → revalidatePath('/sitemap.xml')
      robots/
        route.ts                   ← GET/PATCH robots config in admin_settings

src/app/admin/_lib/
  schemas/sitemap.ts               ← Zod schemas for custom entry + robots config
  queries/sitemap.ts               ← server query helpers
```

---

## Database Design

### New table: `sitemap_custom_entries`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| url | text NOT NULL UNIQUE | Full URL, e.g. `https://bestfinds.com/en/deals` |
| priority | numeric(2,1) | 0.1–1.0, default 0.5 |
| changefreq | text | `always\|hourly\|daily\|weekly\|monthly\|yearly\|never` |
| last_modified | timestamptz | Optional explicit lastmod |
| is_active | boolean | Default true |
| notes | text | Admin-only annotation |
| created_at | timestamptz | now() |
| updated_at | timestamptz | auto-trigger |

### `admin_settings` keys added
| Key | Value shape | Description |
|---|---|---|
| `sitemap_exclusions` | `{ slugs: string[] }` | Slug strings excluded from sitemap |
| `sitemap_cache_ttl` | `{ seconds: number }` | ISR TTL for sitemap (default 3600) |
| `robots_config` | `{ rules: RobotsRule[] }` | Array of `{ userAgent, allow[], disallow[] }` |

---

## Constraints & Decisions

1. **No sitemap XML file on disk** — the sitemap remains a Next.js route, not a static file. This keeps deployment simple and consistent with Phase 6 design.
2. **Exclusions by slug prefix** — exclusions match product/category/blog slugs by `slug.en` value (consistent with how `sitemap.ts` already navigates JSONB slugs).
3. **robots.txt** — stored in `admin_settings` as structured JSON, read by `robots.ts` at request time. Fallback to hardcoded defaults if key is missing.
4. **ISR revalidation** — `revalidatePath('/sitemap.xml', 'page')` called from a server action; also called automatically by the import/publish product APIs after any status change.
5. **Custom entry URL** — must start with `NEXT_PUBLIC_SITE_URL`; validated by Zod `z.string().url()` with a `.startsWith` refine.
6. **Admin-only** — all new API routes use `requireAdmin()` before any DB operation.

---

## Dependencies

- Phase 8 (admin auth, `requireAdmin`, AdminShell)
- Phase 9 (sitemap revalidation hook on product publish)
- Phase 11 (product status changes that affect sitemap)

---

## Estimated Complexity

| Area | Effort |
|---|---|
| DB migration | Low |
| sitemap.ts / robots.ts modification | Low |
| Admin UI (4 panels) | Medium |
| API routes (4 routes) | Low |
| Tests | Medium |
| **Total** | ~1 sprint |
