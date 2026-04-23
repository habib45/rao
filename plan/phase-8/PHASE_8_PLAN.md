# Phase 8 — Admin Panel

## Objective

Production-grade internal admin panel at `/admin` for managing products, categories, analytics, translations, and settings. Accessible only to Supabase users with `app_metadata.role = "admin"`. Completely separate from the public storefront — English-only, no next-intl routing.

---

## Feature List

| ID | Feature | Priority | Complexity | Document |
|---|---|---|---|---|
| F8.A | Foundation (Auth, Middleware, Layout, UI Primitives) | P0 | High | [features/F8.A-foundation.md](features/F8.A-foundation.md) |
| F8.B | Admin Dashboard | P0 | Medium | [features/F8.B-dashboard.md](features/F8.B-dashboard.md) |
| F8.C | Products CRUD | P0 | High | [features/F8.C-products-crud.md](features/F8.C-products-crud.md) |
| F8.D | Categories CRUD | P0 | Medium | [features/F8.D-categories-crud.md](features/F8.D-categories-crud.md) |
| F8.E | Analytics | P1 | Medium | [features/F8.E-analytics.md](features/F8.E-analytics.md) |
| F8.F | Translations & Settings | P1 | Medium | [features/F8.F-translations-settings.md](features/F8.F-translations-settings.md) |
| F8.G | Tests & Quality Gates | P0 | High | [features/F8.G-tests.md](features/F8.G-tests.md) |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth model | `app_metadata.role = 'admin'` JWT claim | No extra table; RLS reads from `auth.jwt()` directly |
| UI library | Hand-built primitives in `_components/ui/` | Avoids Radix/shadcn React 19 compatibility issues |
| Data mutations | API Route Handlers + service role client | Middleware gates access; service role bypasses RLS |
| Charts | recharts | React 19 compatible, lightweight |
| Admin locale | English-only (not under `[locale]`) | Simplifies routing; admin is internal tooling |
| Dark mode | `.dark` class toggle on `<html>` | Works with Tailwind v4 `@theme inline` tokens |

---

## New Dependencies

`@tanstack/react-query`, `zod`, `recharts`, `sonner`, `lucide-react`, `clsx`, `tailwind-merge`

## New Environment Variable

`SUPABASE_SERVICE_ROLE_KEY` — server-only, never `NEXT_PUBLIC_`

## New Migrations

- `supabase/migrations/00006_admin_rls.sql` — RLS policies, `admin_settings`, `sync_logs` tables
- `supabase/migrations/00007_admin_dashboard_functions.sql` — Postgres RPCs for dashboard aggregations

---

## Dependency Order

```
F8.A (Foundation — auth, layout, UI)
 └── F8.B (Dashboard)
 └── F8.C (Products CRUD)
 └── F8.D (Categories CRUD)
 └── F8.E (Analytics)
 └── F8.F (Translations + Settings)
 └── F8.G (Tests)
```

---

## Acceptance Criteria (Phase 8 Complete When)

- [ ] `/admin/login` accessible unauthenticated
- [ ] `/admin/*` redirects to `/admin/login` without valid admin JWT
- [ ] Admin user can log in and see dashboard
- [ ] Products list, search, filter, edit, soft-delete all work
- [ ] Categories create/edit/deactivate all work
- [ ] Analytics click table, CSV export, price history chart work
- [ ] Translations editor saves bulk updates
- [ ] Settings form saves affiliate tags and feature flags
- [ ] Dark mode toggle persists via `.dark` class
- [ ] All tests pass: 307+ tests, 0 TypeScript errors, 0 ESLint warnings
- [ ] Storefront pages (`/en`, `/bn-BD`, `/sv`) unaffected

---

## File Structure After Phase 8

```
src/
├── lib/supabase/admin.ts
├── middleware.ts (modified — admin JWT gate added)
└── app/admin/
    ├── layout.tsx
    ├── admin.css
    ├── login/
    │   ├── layout.tsx
    │   └── page.tsx
    ├── (dashboard)/page.tsx
    ├── products/
    │   ├── page.tsx
    │   ├── _components/{ProductsTable,ProductFilters}.tsx
    │   └── [id]/
    │       ├── page.tsx
    │       └── _components/{ProductEditForm,LocaleFieldGroup,ForceSyncButton}.tsx
    ├── categories/
    │   ├── page.tsx
    │   └── _components/{CategoriesTable,CategoryFormDialog}.tsx
    ├── analytics/
    │   ├── page.tsx
    │   └── _components/{ClicksTable,PriceHistoryChart,AnalyticsTabs}.tsx
    ├── translations/
    │   ├── page.tsx
    │   └── _components/TranslationsEditor.tsx
    ├── settings/
    │   ├── page.tsx
    │   └── _components/SettingsForm.tsx
    ├── api/
    │   ├── auth/signout/route.ts
    │   ├── products/route.ts
    │   ├── products/[id]/route.ts
    │   ├── products/[id]/sync/route.ts
    │   ├── categories/route.ts
    │   ├── categories/[id]/route.ts
    │   ├── analytics/clicks/route.ts
    │   ├── analytics/clicks/export/route.ts
    │   ├── analytics/price-history/route.ts
    │   ├── translations/route.ts
    │   └── settings/route.ts
    ├── _components/
    │   ├── AdminShell.tsx
    │   ├── Providers.tsx
    │   ├── ui/{button,input,table,dialog,select,badge,tabs,card,skeleton}.tsx
    │   ├── charts/{ClickTrendsChart,TopCategoriesChart}.tsx
    │   └── dashboard/{StatsCard,SyncStatusTable}.tsx
    └── _lib/
        ├── cn.ts
        ├── auth.ts
        ├── actions.ts
        ├── queries/dashboard.ts
        ├── schemas/{product,category,translation,settings}.ts
        └── utils/slugify.ts

supabase/migrations/
├── 00006_admin_rls.sql
└── 00007_admin_dashboard_functions.sql
```
