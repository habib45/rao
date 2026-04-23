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
