# Amazon Affiliate E-Commerce Platform — Master Development Plan

## Project Overview

A multi-locale Amazon Affiliate E-Commerce Platform that displays curated Amazon products, tracks affiliate clicks, and redirects users to Amazon for purchase. No direct checkout — all revenue is via Amazon Associates commission.

**Stack:** Next.js 15 App Router | React TypeScript | Supabase (PostgreSQL + Edge Functions) | Tailwind CSS | Amazon PA-API 5.0  
**Locales:** en (default) | bn-BD (Bangla) | sv (Swedish)

---

## Development Phases

### Phase 1: Project Foundation & Setup
**Goal:** Scaffold the project, define types, configure i18n, set up Supabase clients, and establish the root layout with font loading.  
**Duration estimate:** 1 sprint  
**Deliverables:**
- Initialized Next.js 15 project with TypeScript strict mode, Tailwind CSS, ESLint
- All domain types defined and exported
- Supabase browser + server client helpers
- next-intl configured for 3 locales with middleware
- Root locale layout with conditional Bengali font loading
- 100% test coverage for all utilities and configurations

### Phase 2: Database Schema & Migrations
**Goal:** Create the full Supabase PostgreSQL schema with tables, indexes, RLS policies, triggers, and seed data.  
**Duration estimate:** 1 sprint  
**Deliverables:**
- SQL migrations for all 7 tables (categories, products, product_images, click_tracking, cart_items, translations_ui, price_history)
- GIN indexes on all JSONB and tsvector columns
- RLS policies enforcing access control
- Auto-update triggers for updated_at
- Seed data for development/testing

**Dependencies:** Phase 1 (types must exist for generated Supabase types)

### Phase 3: Amazon PA-API 5.0 Integration
**Goal:** Build Supabase Edge Functions for product sync, price updates, click tracking, and search.  
**Duration estimate:** 1.5 sprints  
**Deliverables:**
- Shared PA-API module with AWS SigV4 signing
- sync-amazon-products Edge Function (cron: Sundays 3 AM UTC)
- update-prices Edge Function (cron: daily 1 AM UTC)
- track-click Edge Function (POST)
- search-products Edge Function (GET)
- Rate limiting, exponential backoff, error handling

**Dependencies:** Phase 2 (database tables must exist)

### Phase 4: Core Pages & Components
**Goal:** Build all App Router pages and reusable UI components.  
**Duration estimate:** 2 sprints  
**Deliverables:**
- Homepage with hero, categories, featured products
- Product listing with filters (sidebar + mobile drawer)
- Product detail page with ISR, SEO metadata, JSON-LD
- Category pages
- Search page
- Cart page (client component)
- All shared components (Header, Footer, ProductCard, etc.)

**Dependencies:** Phase 3 (API data must be available)

### Phase 5: Cart System
**Goal:** Implement localStorage-first cart with optional Supabase sync for authenticated users.  
**Duration estimate:** 0.5 sprint  
**Deliverables:**
- CartProvider (React context)
- localStorage CRUD helpers with SSR safety
- Cart UI (CartItem, CartSummary, CheckoutRedirect)
- Optional Supabase cart_items sync for auth'd users

**Dependencies:** Phase 4 (components must exist)

### Phase 6: SEO & Performance
**Goal:** Implement dynamic sitemap, robots.txt, OG images, and optimize Core Web Vitals.  
**Duration estimate:** 1 sprint  
**Deliverables:**
- Dynamic XML sitemap with hreflang alternates
- robots.txt route
- Dynamic OG image generation per product
- Lighthouse audit: target 90+ all categories
- Image optimization, font loading, skeleton states

**Dependencies:** Phase 4 (pages must exist)

### Phase 7: Testing, QA & Deployment
**Goal:** End-to-end testing, security audit, and production deployment.  
**Duration estimate:** 1 sprint  
**Deliverables:**
- E2E tests for all 3 locales
- Security audit (no secrets in client bundle)
- CI/CD pipeline (GitHub Actions)
- Vercel deployment with ISR
- Supabase Edge Function deployment
- Pre-launch checklist verification

**Dependencies:** All prior phases

---

### Phase 8: Admin Panel
**Goal:** Production-grade internal admin panel at `/admin` for managing products, categories, analytics, translations, and settings. Accessible only to authenticated Supabase users with `app_metadata.role = "admin"`.  
**Duration estimate:** 2 sprints  
**Deliverables:**
- Supabase JWT-based admin auth (no extra DB table)
- Middleware guard on all `/admin/*` routes
- RLS policies for admin CRUD on all 7 tables
- `admin_settings` and `sync_logs` tables
- Dashboard with stats cards, click trend chart, top categories chart, sync log table
- Products CRUD: list with search/filter/pagination, edit form (multi-locale tabbed), force Amazon sync
- Categories CRUD: list table, create/edit modal with multi-locale fields and auto-slug
- Analytics: paginated click events with date/locale/groupBy filters, CSV export, price history line chart
- Translations editor: inline table for missing translation detection and bulk save
- Settings page: affiliate tags per locale, feature flags, sync config (read-only)
- Hand-built UI primitives (button, input, table, dialog, select, badge, tabs, card, skeleton)
- Dark mode toggle via `.dark` class on `<html>`
- Full test coverage: unit (slugify, schemas, auth), component (StatsCard, ProductFilters), API route (products, categories), middleware

**New Dependencies:** `@tanstack/react-query`, `zod`, `recharts`, `sonner`, `lucide-react`, `clsx`, `tailwind-merge`

**New Env Var:** `SUPABASE_SERVICE_ROLE_KEY` (server-only)

**New Migrations:**
- `supabase/migrations/00006_admin_rls.sql` — RLS policies, `admin_settings`, `sync_logs`
- `supabase/migrations/00007_admin_dashboard_functions.sql` — Postgres RPC functions for dashboard aggregations

**Sub-phases:**

#### Phase A — Foundation
- `supabase/migrations/00006_admin_rls.sql`: Admin CRUD policies on all 7 tables, `admin_settings` table (key/value JSONB), `sync_logs` table
- `src/lib/supabase/admin.ts`: Server-only service-role Supabase client
- `src/middleware.ts` (modified): Admin JWT auth gate + next-intl delegation
- `src/app/admin/layout.tsx`, `admin.css`: HTML root layout + dark mode CSS vars
- `src/app/admin/_components/AdminShell.tsx`: Collapsible sidebar, header with email/dark-mode toggle/sign-out
- `src/app/admin/_components/Providers.tsx`: TanStack Query provider
- `src/app/admin/login/page.tsx`: Email/password login form (Supabase `signInWithPassword`)
- `src/app/admin/_lib/auth.ts`: `getAdminUser()` + `requireAdmin()` server helpers
- `src/app/admin/_lib/actions.ts`: `signOut()` server action
- `src/app/admin/_components/ui/`: button, input, table, dialog, select, badge, tabs, card, skeleton

#### Phase B — Admin Dashboard
- `supabase/migrations/00007_admin_dashboard_functions.sql`: Postgres RPCs — `admin_dashboard_stats()`, `admin_click_trends(days_back)`, `admin_top_categories(lim)`
- `src/app/admin/_lib/queries/dashboard.ts`: `getDashboardStats()`, `getClickTrends()`, `getTopCategories()`, `getRecentSyncLogs()`, `getTopProducts()`
- `src/app/admin/(dashboard)/page.tsx`: Dashboard page with:
  - **4 stats cards**: Total Products, Active Categories, Clicks (7d), Clicks (30d)
  - **Click Trends AreaChart** (30 days, recharts)
  - **Top Categories BarChart** (recharts)
  - **Top Products list** (by click count)
  - **Sync Logs table** (function name, status badge, item count, timestamps)
- `_components/dashboard/StatsCard.tsx`, `SyncStatusTable.tsx`
- `_components/charts/ClickTrendsChart.tsx`, `TopCategoriesChart.tsx`

#### Phase C — Products CRUD
- `src/app/admin/_lib/schemas/product.ts`: Zod `productUpdateSchema` (multi-locale TranslationMap, availability enum, discount 0–100)
- `src/app/admin/api/products/route.ts`: GET with search/filter/pagination
- `src/app/admin/api/products/[id]/route.ts`: GET, PATCH (Zod validated), DELETE (soft)
- `src/app/admin/api/products/[id]/sync/route.ts`: POST force sync via Edge Function
- `src/app/admin/products/page.tsx` + `ProductsTable.tsx`: Paginated table with image, name, ASIN, price, rating, status toggle
- `ProductFilters.tsx`: Debounced (300ms) search, category select, status select
- `src/app/admin/products/[id]/page.tsx` + `ProductEditForm.tsx`: Tabbed form (General, Locales en/bn-BD/sv, Features, Pricing, Images)
- `LocaleFieldGroup.tsx`, `ForceSyncButton.tsx`

#### Phase D — Categories CRUD
- `src/app/admin/_lib/schemas/category.ts`: Zod `categorySchema` (multi-locale, UUID parent_id, image_url transforms "" → null)
- `src/app/admin/_lib/utils/slugify.ts`: `slugify()` — NFD normalize, strip non-alphanumeric, hyphens
- `src/app/admin/api/categories/route.ts`: GET (with product counts), POST
- `src/app/admin/api/categories/[id]/route.ts`: GET, PATCH, DELETE (soft `is_active=false`)
- `src/app/admin/categories/page.tsx` + `CategoriesTable.tsx`: Table with name/slug/parent/product count/sort order/status, edit + deactivate actions
- `CategoryFormDialog.tsx`: Multi-locale create/edit modal with auto-slug generation button

#### Phase E — Analytics
- `src/app/admin/api/analytics/clicks/route.ts`: GET paginated/grouped (by day/locale/product) with date + locale filters
- `src/app/admin/api/analytics/clicks/export/route.ts`: GET CSV stream (up to 10k rows)
- `src/app/admin/api/analytics/price-history/route.ts`: GET per-product price history (up to 365 entries)
- `src/app/admin/analytics/page.tsx` + `AnalyticsTabs.tsx`: Tabbed layout
- `ClicksTable.tsx`: Paginated click log with date range, locale, group-by filters + CSV export button
- `PriceHistoryChart.tsx`: Product selector + recharts LineChart

#### Phase F — Translations & Settings
- `src/app/admin/_lib/schemas/translation.ts`: Zod schema for bulk translation update array
- `src/app/admin/api/translations/route.ts`: GET (with `_missing` annotations), PATCH (per-field locale update)
- `src/app/admin/translations/page.tsx` + `TranslationsEditor.tsx`: Inline editable table, missing translations highlighted in amber, bulk save
- `src/app/admin/api/settings/route.ts`: GET/PATCH `admin_settings` key-value store
- `src/app/admin/settings/page.tsx` + `SettingsForm.tsx`: Affiliate tags (per locale), sync config (read-only), feature flags (cart, reviews, price alerts)

#### Phase G — Tests + Quality Gates
- `_lib/utils/__tests__/slugify.test.ts` (14 cases: Latin, diacritics, Swedish, Bengali, edge cases)
- `_lib/__tests__/schemas.test.ts` (28 cases: categorySchema, productUpdateSchema, translationUpdateSchema)
- `_lib/__tests__/auth.test.ts` (8 cases: getAdminUser role checks, requireAdmin redirect)
- `_components/__tests__/StatsCard.test.tsx` (6 cases: title, value, description, icon)
- `products/_components/__tests__/ProductFilters.test.tsx` (7 cases: render, debounce, category select)
- `api/__tests__/categories.test.ts` (9 cases: GET/POST/PATCH/DELETE with validation + error paths)
- `api/__tests__/products.test.ts` (7 cases: PATCH validation, DELETE soft, error paths)
- `src/__tests__/middleware.test.ts` (10 cases: admin auth gate, locale delegation, API bypass)
- Quality gates: `tsc --noEmit` (0 errors), `vitest run` (307/307 passing), `eslint --max-warnings 0`

**Dependencies:** Phases 1–6 (all storefront features must exist)

---

### Phase 9: Admin Product Ingestion & Scheduled Publishing
**Goal:** Extend the admin panel with two ingestion/workflow features: (1) import a single product by ASIN on demand, and (2) schedule products to be automatically published at a future time.
**Duration estimate:** 0.5 sprint
**Deliverables:**

#### Feature 9.1 — Import Product by ASIN
- New Edge Function `supabase/functions/import-product/index.ts` that calls PA-API `GetItems` for a single ASIN and returns a normalized row.
- New admin API route `src/app/admin/api/products/import/route.ts` (POST, Zod-validated, service-role) that invokes the Edge Function, upserts a draft product (`is_active: false`), inserts the primary image, and returns `{ product_id, asin, name }`.
- New dashboard widget `AsinImportWidget` (client component) with ASIN input, Sync button, loading/success/error states, and a link to the draft's edit page.

#### Feature 9.2 — Schedule Product Publishing
- New migration `supabase/migrations/00008_product_scheduling.sql` adding `publish_at TIMESTAMPTZ NULL` on `products`, a partial index, and a `publish_scheduled_products()` RPC.
- New Edge Function `supabase/functions/publish-scheduled/index.ts` (hourly cron) that invokes the RPC and writes a `sync_logs` row.
- Domain type update: `Product.publish_at?: string | null`.
- Zod schema update: `publish_at` accepted on PATCH (ISO datetime or null).
- `ProductEditForm` scheduling section (visible only when draft): datetime-local input, "Schedule", "Publish Now", "Clear schedule".
- Dashboard widget `ScheduledPublishWidget` (server component) listing next 10 scheduled products.
- New dashboard query `getScheduledProducts()` in `_lib/queries/dashboard.ts`.

**New Dependencies:** None (reuses existing stack).

**New Migrations:**
- `supabase/migrations/00008_product_scheduling.sql` — `publish_at` column, partial index, `publish_scheduled_products()` function.

**Dependencies:** Phase 8 (admin shell, auth, existing product APIs).

**Test coverage:**
- `AsinImportWidget` render/loading/success/error/validation (5 cases)
- `ScheduledPublishWidget` list/empty/date-format (3 cases)
- Import API route validate/success/upsert/edge-failure (4 cases)
- Publish-schedule scheduler component render/set/publish/clear (4 cases)
- Products PATCH accepts `publish_at` (ISO + null) — extends existing test file
- Full quality gates: `tsc --noEmit`, `eslint . --max-warnings 0`, `vitest run` with all 307 prior + new tests passing.

---

### Phase 10: Public UI Redesign
**Goal:** Replace the first-cut storefront visuals with a production-grade design for the homepage and product listing page, plus supporting Header/Footer/ProductCard and filter components.
**Duration estimate:** 1 sprint (delivered prior to documentation sweep)
**Deliverables:**
- Redesigned homepage (`src/app/[locale]/page.tsx`) with hero block, category icon grid, featured & deal sections
- Redesigned product list page (`src/app/[locale]/products/page.tsx`) with sidebar filters, sort control, pagination
- New shared components: `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ProductCard.tsx`
- New product-list sub-components: `SidebarFilters.tsx`, `SortSelect.tsx`, `Pagination.tsx`
- New query helpers in `src/lib/queries/products.ts`: `getProductsFiltered`, `getProductFilterMeta`, `getProductsByCategoryLimit`
- Category detail page refresh (`src/app/[locale]/categories/[slug]/page.tsx`) consuming the shared card/grid

**Dependencies:** Phase 8 (admin-owned data surfaces), Phase 9 (data completeness guarantees via scheduling/import)

### Phase 11: Rich Product Creation Form + Approval Workflow
**Goal:** Let admins compose full product pages inside the admin panel (with a rich text editor) and gate publication behind a draft → review → approved → published workflow.
**Duration estimate:** 1.5 sprints
**Deliverables:**

#### Feature 11.1 — Product Status Workflow
- Migration `supabase/migrations/00009_product_workflow.sql` adding `product_status` enum (`draft | pending_review | approved | published`), `rejection_reason`, `submitted_by` columns and partial index
- Domain type update: `Product.product_status`, `rejection_reason`, `submitted_by`
- Zod `productUpdateSchema` accepts `product_status`
- API routes: `POST /admin/api/products/[id]/approve`, `.../reject`, `.../publish`
- `getScheduledProducts` filters by `product_status='approved'`
- Review queue page `src/app/admin/products/review/page.tsx` with Approve / Reject (with reason) actions
- AdminShell sidebar: "Review Queue" link with pending badge count

#### Feature 11.2 — Rich Text Editor
- Install TipTap: `@tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-table` (+ row/header/cell) `@tiptap/extension-image @tiptap/extension-link @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight @tiptap/extension-placeholder`
- Build `src/app/admin/_components/ui/RichTextEditor.tsx` (client-only, dynamic-imported)
- Toolbar: Bold/Italic/Underline/Strike, H1-H3, bullet/ordered lists, table insert, link, image URL, text align, color, highlight, undo/redo
- Output: HTML string, stored in `products.description` TranslationMap per locale

#### Feature 11.3 — Product Creation Form
- `src/app/admin/products/new/page.tsx` + `ProductCreateForm.tsx` (client)
- Fields: title (all 3 locales), slug (auto from title), category, brand, price, original price, currency, discount %, availability, features (dynamic list), description (RichTextEditor per locale tab), meta_title, meta_description, image URLs
- Product edit form now supports manual image URL add/remove in the Images tab and persists images to `product_images`
- "Sync from Amazon" sub-widget: ASIN input → calls `/admin/api/products/import` → autofills form
- Buttons: "Save as Draft" (`product_status='draft'`) and "Submit for Review" (`product_status='pending_review'`)
- `New Product` button on `/admin/products` pointing at `/admin/products/new`

**New Dependencies:** TipTap suite (see above)

**New Migrations:**
- `supabase/migrations/00009_product_workflow.sql`

**Dependencies:** Phase 9 (existing import + scheduling APIs reused)

### Phase 12: Product Review System
**Goal:** Let shoppers submit reviews from the public product page and give admins a moderation queue.
**Duration estimate:** 1 sprint
**Deliverables:**

#### Feature 12.1 — Review Schema & RLS
- Migration `supabase/migrations/00010_product_reviews.sql`: `product_reviews` table with rating 1-5 check, status enum (`pending | approved | rejected`), author email/name, admin note, `updated_at` trigger
- RLS: public SELECT where `status='approved'` OR the row matches `reviewer_email` cookie claim; public INSERT; admin full access

#### Feature 12.2 — Public Review UI
- `src/app/[locale]/products/[slug]/_components/ReviewSection.tsx` (client)
- `src/app/api/reviews/[productId]/route.ts` (GET: approved + own pending)
- `src/app/api/reviews/route.ts` (POST: Zod-validated insert, sets `reviewer_email` cookie 1 year)
- Star-rating read/write component
- Success state: "Your review is pending approval"

#### Feature 12.3 — Admin Review Moderation
- `src/app/admin/reviews/page.tsx` with Pending / Approved / Rejected tabs
- `src/app/admin/api/reviews/route.ts` (GET with status filter + pagination)
- `src/app/admin/api/reviews/[id]/route.ts` (PATCH to approve/reject with optional admin_note)
- AdminShell sidebar: "Reviews" link

**New Migrations:**
- `supabase/migrations/00010_product_reviews.sql`

**Dependencies:** Phase 11 (admin shell link conventions), Phase 10 (product detail integration)

### Phase 13: Media Manager (Supabase Storage)
**Goal:** Provide a built-in media manager inside the admin panel so admins can upload, organise, and pick images without leaving the dashboard, and plug it directly into the product forms.
**Duration estimate:** 1 sprint
**Deliverables:**

#### Feature 13.1 — Storage Setup
- Public Supabase Storage bucket `media`
- RLS: admin can upload/delete; public can read

#### Feature 13.2 — Admin Media Manager UI
- `src/app/admin/media/page.tsx` with folder tree (create + navigate) and grid of images (filename, size, copy URL)
- Drag-and-drop + file-picker upload with progress
- Folder creation modal
- Image actions: copy URL, delete, rename
- Filter images only (jpg/png/webp/gif/svg)

#### Feature 13.3 — API Routes
- `src/app/admin/api/media/route.ts` — GET list files in path, POST create folder
- `src/app/admin/api/media/upload/route.ts` — POST multipart upload
- `src/app/admin/api/media/[...path]/route.ts` — DELETE file/folder

#### Feature 13.4 — Product Form Integration
- "Browse Media" button in `ProductCreateForm` and `ProductEditForm` opening a modal media picker that inserts chosen image URLs back into the form
- AdminShell sidebar: "Media" link

**Dependencies:** Phase 11 (integrates with create form)

### Phase 16: Related Content Sections (Blog & Product Detail)
**Goal:** Surface related content at the bottom of the blog detail page (related posts by category) and the product detail page (related products by category) to improve engagement and SEO internal linking.  
**Duration estimate:** 0.5 sprint  
**Deliverables:**

#### Feature 16.1 — Related Blog Posts section
- New `RelatedBlogCard` inline component in `src/app/[locale]/blog/[slug]/page.tsx`
- Full-width "More from [Category]" grid (up to 3 posts) rendered below the comments section
- Reuses the already-fetched `related` array from `getRelatedBlogPosts()`

#### Feature 16.2 — `getRelatedProducts()` query helper
- New function in `src/lib/queries/products.ts` with signature `getRelatedProducts(productId, categoryId, limit=4)`
- Filters `is_active=true`, excludes current product via `.neq("id", productId)`, orders by `created_at desc`

#### Feature 16.3 — Related Products section
- "You may also like" grid (up to 4 products) added to `src/app/[locale]/products/[slug]/page.tsx` below the main two-column layout
- Uses existing `ProductCard` component with `showPrice` forwarded from `getSiteSettings()`

**New Migrations:** None  
**Dependencies:** Phase 14 (blog system), Phase 10 (ProductCard), Phase 15 (showPrice setting)

### Phase 17: Admin Sitemap Management
**Goal:** Give admins full visibility and control over the sitemap and robots.txt from inside the admin panel — without requiring a redeploy. The existing `sitemap.ts` is a live dynamic Next.js route (queries Supabase on every request); this phase adds manual entry management, URL exclusions, robots.txt editing, and an in-panel preview/regenerate capability.
**Duration estimate:** 1 sprint
**Deliverables:**

#### Feature 17.1 — DB Config
- Migration `supabase/migrations/00011_sitemap_config.sql`: `sitemap_custom_entries` table (custom URLs with priority/changefreq/lastmod), `admin_settings` seeds for `sitemap_exclusions`, `sitemap_cache_ttl`, `robots_config`

#### Feature 17.2 — Modify `sitemap.ts`
- `export const revalidate = 3600` (ISR caching)
- Reads `sitemap_exclusions` from `admin_settings` and filters out matching slugs
- Appends `sitemap_custom_entries` (active only) to generated entries

#### Feature 17.3 — Admin Sitemap UI
- `src/app/admin/sitemap/page.tsx` with 4 tabs: Preview, Custom URLs, Exclusions, Robots.txt
- `SitemapPreviewTable`, `CustomEntriesPanel`, `ExclusionsPanel`, `RobotsEditor` components
- `RegenerateButton` that calls `revalidatePath('/sitemap.xml')` via server action

#### Feature 17.4 — API Routes
- `GET|POST|PATCH|DELETE /admin/api/sitemap` — list/preview/CRUD custom entries
- `GET|PATCH /admin/api/sitemap/exclusions` — manage exclusion slugs in admin_settings
- `POST /admin/api/sitemap/revalidate` — bust ISR cache
- `GET|PATCH /admin/api/sitemap/robots` — read/write robots rules in admin_settings

#### Feature 17.5 — Dynamic Robots.txt
- `src/app/robots.ts` reads `robots_config` from `admin_settings`; falls back to hardcoded defaults on DB failure

**New Dependencies:** None  
**New Migrations:** `supabase/migrations/00011_sitemap_config.sql`  
**New Tests:** 40 (sitemap logic, robots logic, schemas, API routes, UI components)  
**Dependencies:** Phase 8 (admin auth, AdminShell), Phase 9 (revalidation hook)

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Rendering strategy | ISR (no pure SSR) | Static HTML for CWV; prices stay fresh via revalidation |
| Cart storage | localStorage-first | Works for guests; no auth required for browsing |
| Translated fields | JSONB TranslationMap | Single row per entity; GIN-indexable; no JOIN overhead |
| Price storage | Integer cents | Avoids floating-point precision errors |
| API key security | Edge Functions only | Amazon keys never touch client bundle |
| Search | PostgreSQL tsvector | Native FTS per locale; no external search service |
| Checkout | Amazon redirect | Required by Amazon Associates TOS |

---

## Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R1 | PA-API rate limiting blocks sync | Medium | High | 1.1s delay between calls; exponential backoff on 429; batch max 10 ASINs |
| R2 | Amazon TOS violation | Low | Critical | Prices refreshed < 24h; no direct checkout; display affiliate disclosure |
| R3 | Stale prices displayed | Medium | Medium | ISR revalidation 1h; "Price as of" disclaimer; price_history audit trail |
| R4 | Bengali font fails to load | Low | Medium | Noto Sans Bengali via next/font with display:swap; CSS fallback chain |
| R5 | Missing translations break UI | Medium | Medium | t() helper always falls back to en; translation completeness checks |
| R6 | Secret key exposure | Low | Critical | All secrets in Supabase Vault; CI grep check; no NEXT_PUBLIC_ prefix on secrets |
| R7 | JSONB query performance at scale | Low | Medium | GIN indexes; tsvector for FTS; locale-specific key path queries |
| R8 | Cart data loss on browser clear | Medium | Low | Optional Supabase sync for auth'd users; cart_items table |
| R9 | Click fraud inflating analytics | Medium | Low | ip_hash + session dedup; rate limiting on inserts |
| R10 | Product delisted on Amazon | Medium | Low | is_active=false after 3 failed lookups; "Currently unavailable" UI |

---

## Quality Gates

Every phase must pass these gates before moving to the next:

1. **Test coverage >= 100%** for all new code (unit + integration)
2. **No TypeScript errors** (`tsc --noEmit` passes)
3. **No ESLint warnings** (`eslint . --max-warnings 0`)
4. **No secrets in client bundle** (grep verification)
5. **All 3 locales tested** (en, bn-BD, sv)
6. **Feature documents reviewed** and up-to-date
7. **Accessibility audit** (semantic HTML, aria labels, keyboard nav)

---

## Dependency Graph

```
Phase 1 (Foundation)
  └── Phase 2 (Database)
       └── Phase 3 (PA-API)
            └── Phase 4 (Pages & Components)
                 ├── Phase 5 (Cart)
                 └── Phase 6 (SEO)
                      ├── Phase 7 (QA & Deploy)
                      └── Phase 8 (Admin Panel)
                           └── Phase 9 (ASIN Import + Scheduled Publishing)
                                └── Phase 10 (Public UI Redesign)
                                     └── Phase 11 (Rich Product Form + Approval Workflow)
                                          ├── Phase 12 (Product Review System)
                                          └── Phase 13 (Media Manager)
```

---

## Phase Detailed Breakdowns

| Phase | Plan Document | Status |
|---|---|---|
| Phase 1 — Foundation | [phase-1/PHASE_1_PLAN.md](phase-1/PHASE_1_PLAN.md) | ✅ Complete |
| Phase 2 — Database Schema | [phase-2/PHASE_2_PLAN.md](phase-2/PHASE_2_PLAN.md) | ✅ Complete |
| Phase 3 — PA-API Integration | [phase-3/PHASE_3_PLAN.md](phase-3/PHASE_3_PLAN.md) | ✅ Complete |
| Phase 4 — Core Pages & Components | [phase-4/PHASE_4_PLAN.md](phase-4/PHASE_4_PLAN.md) | ✅ Complete |
| Phase 5 — Cart System | [phase-5/PHASE_5_PLAN.md](phase-5/PHASE_5_PLAN.md) | ✅ Complete |
| Phase 6 — SEO & Performance | [phase-6/PHASE_6_PLAN.md](phase-6/PHASE_6_PLAN.md) | ✅ Complete |
| Phase 7 — Testing, QA & Deployment | [phase-7/PHASE_7_PLAN.md](phase-7/PHASE_7_PLAN.md) | ✅ Complete |
| Phase 8 — Admin Panel | [phase-8/PHASE_8_PLAN.md](phase-8/PHASE_8_PLAN.md) | ✅ Complete |
| Phase 9 — Admin ASIN Import & Scheduled Publishing | [phase-9/PHASE_9_PLAN.md](phase-9/PHASE_9_PLAN.md) | ✅ Complete |
| Phase 10 — Public UI Redesign | [phase-10/PHASE_10_PLAN.md](phase-10/PHASE_10_PLAN.md) | ✅ Complete |
| Phase 11 — Rich Product Form + Approval Workflow | [phase-11/PHASE_11_PLAN.md](phase-11/PHASE_11_PLAN.md) | 🚧 In Progress |
| Phase 12 — Product Review System | [phase-12/PHASE_12_PLAN.md](phase-12/PHASE_12_PLAN.md) | 📋 Planned |
| Phase 13 — Media Manager (Supabase Storage) | [phase-13/PHASE_13_PLAN.md](phase-13/PHASE_13_PLAN.md) | 📋 Planned |
| Phase 14 — Blog System (SEO-Driven) | [phase-14/PHASE_14_PLAN.md](phase-14/PHASE_14_PLAN.md) | 🚧 In Progress |
| Phase 15 — Admin Settings: Price Display Toggle | [phase-15/PHASE_15_PLAN.md](phase-15/PHASE_15_PLAN.md) | 🚧 In Progress |
| Phase 17 — Admin Sitemap Management | [phase-17/PHASE_17_PLAN.md](phase-17/PHASE_17_PLAN.md) | 📋 Planned |
| Phase 18 — Blog Enhancements (Pagination, Filtering, Newsletter, Comments) | [phase-18/PHASE_18_PLAN.md](phase-18/PHASE_18_PLAN.md) | 🚧 In Progress |
