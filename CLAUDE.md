# CLAUDE.md — Project Instructions for Claude Code

## Project Overview

**ORH / BestFinds** — Amazon Affiliate E-Commerce Platform  
**Stack:** Next.js 15 App Router | React 19 | TypeScript (strict) | Supabase | Tailwind CSS v4 | Amazon PA-API 5.0  
**Locales:** `en` (default) | `bn-BD` (Bangla) | `sv` (Swedish)

---

## Development Workflow (MANDATORY)

The user's required workflow before coding any phase or feature:

1. **Update `plan/DEVELOPMENT_PLAN.md`** — add or update the phase/feature summary
2. **Create/update the phase plan folder** — `plan/phase-N/PHASE_N_PLAN.md` with feature list, acceptance criteria, file structure
3. **Write feature documents** — `plan/phase-N/features/FN.X-name.md` for each feature
4. **Write test matrix** — `plan/phase-N/tests/TEST_MATRIX.md` with all test cases
5. **THEN begin coding** — only after plan documents are approved

**Never write code before the plan documents are in place.**

---

## Quality Gates (Run Before Marking Any Phase Complete)

```bash
npx tsc --noEmit           # Must pass with 0 errors
npx eslint . --max-warnings 0   # Must pass with 0 warnings
npx vitest run             # All tests must pass (currently 307/307)
```

---

## Code Conventions

### TypeScript
- Strict mode always on
- Path alias: `@/*` → `src/*`
- No `any` — use proper types or `unknown` with narrowing
- Domain types in `src/types/domain.ts`

### React / Next.js
- Server components by default; add `"use client"` only when needed (event handlers, hooks, browser APIs)
- ISR on all public pages: `export const revalidate = 3600`
- `generateStaticParams` on all `[slug]` pages
- `generateMetadata` on every page (title, description, OG, hreflang)
- No raw `<img>` — always `next/image` with explicit `width` and `height`

### Supabase
- Browser client: `src/lib/supabase/client.ts` (`createBrowserClient`)
- Server client: `src/lib/supabase/server.ts` (`createServerClient` with cookies)
- Admin client: `src/lib/supabase/admin.ts` (service role — server-only, never in client components)
- Always type with `import type { CookieOptions } from "@supabase/ssr"` for `setAll` params

### Zod Validation
- All API route inputs validated with Zod before any DB operation
- Use `.partial()` for PATCH routes
- Return 400 with `{ error: "Validation failed", issues: [...] }` on parse failure

### Testing (Vitest)
- Vitest with jsdom environment
- `@testing-library/react` with `afterEach(cleanup)`
- Mock `server-only` via vitest alias: `"server-only": "./src/test/server-only.ts"`
- Use `vi.hoisted()` for variables referenced inside `vi.mock()` factories
- Supabase stubs must be thenable (explicit `then(resolve, reject)` method)
- Partially mock `next/server` for middleware tests (replace `NextResponse.next`)

### Admin Panel Specifics
- Admin routes live under `src/app/admin/` (NOT under `[locale]`)
- Admin uses English only — no next-intl
- Auth: `app_metadata.role === "admin"` checked in middleware + `requireAdmin()`
- UI primitives are hand-built in `src/app/admin/_components/ui/` (no Radix/shadcn)
- TanStack Query for all client-side data fetching in admin
- All mutations go through API routes (not direct Supabase from client)

### Styling
- Tailwind CSS v4 with `@theme inline` custom properties
- Dark mode: `.dark` class on `<html>` element (toggle via `document.documentElement.classList`)
- CSS variables: `--color-brand`, `--color-surface`, `--color-foreground`, `--color-muted`, `--color-border`
- `cn()` utility: `clsx` + `tailwind-merge` (in `src/app/admin/_lib/cn.ts`)

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/          ← Public storefront (next-intl)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── categories/
│   │   ├── search/
│   │   └── cart/
│   ├── admin/             ← Admin panel (English-only, no [locale])
│   │   ├── _components/   ← Admin UI components + primitives
│   │   ├── _lib/          ← Auth, schemas, queries, utils
│   │   ├── api/           ← Admin API routes (service role)
│   │   └── ...pages
│   ├── robots.ts
│   └── sitemap.ts
├── components/            ← Public shared components
├── lib/
│   ├── amazon/            ← PA-API client + SigV4
│   ├── cart/              ← Cart context + localStorage
│   ├── i18n/              ← Translation helpers
│   ├── queries/           ← Supabase query helpers
│   └── supabase/          ← Supabase client factories
├── types/domain.ts        ← All domain TypeScript types
├── middleware.ts           ← next-intl + admin JWT auth gate
└── test/server-only.ts    ← Vitest stub for server-only package

supabase/
├── functions/             ← Edge Functions (PA-API, click tracking)
└── migrations/            ← SQL migrations (00001–00007)

plan/                      ← Phase plans (read before coding!)
├── DEVELOPMENT_PLAN.md
├── phase-1/ through phase-8/
```

---

## Environment Variables

```
# Public (safe in client bundle)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=

# Server-only (NEVER NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=

# Supabase Edge Function Vault secrets
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_PARTNER_TAG=
AMAZON_HOST=webservices.amazon.com
```

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `next` 15, `react` 19 | App framework |
| `@supabase/supabase-js`, `@supabase/ssr` | Database + auth |
| `next-intl` | Internationalization (3 locales) |
| `tailwindcss` v4 | Styling |
| `zod` | Schema validation |
| `@tanstack/react-query` | Admin client data fetching |
| `recharts` | Admin charts (AreaChart, BarChart, LineChart) |
| `sonner` | Toast notifications in admin |
| `lucide-react` | Icons in admin |
| `clsx`, `tailwind-merge` | Class name utilities |
| `vitest`, `@testing-library/react` | Testing |

---

## Completed Phases

All phases through 10 are implemented and tested; Phase 11 in progress:
- Phase 1: Project Foundation & Setup ✅
- Phase 2: Database Schema & Migrations (7 tables, RLS, triggers) ✅
- Phase 3: Amazon PA-API 5.0 Integration (4 Edge Functions) ✅
- Phase 4: Core Pages & Components (homepage, products, categories, search) ✅
- Phase 5: Cart System (localStorage + React context) ✅
- Phase 6: SEO & Performance (sitemap, robots, JSON-LD, OG) ✅
- Phase 7: Testing, QA & Deployment ✅
- Phase 8: Admin Panel (dashboard, products/categories CRUD, analytics, translations, settings) ✅
- Phase 9: Admin ASIN Import & Scheduled Publishing (import widget, publish-scheduled cron, ProductEditForm scheduler) ✅
- Phase 10: Public UI Redesign (homepage, product list, shared Header/Footer/ProductCard, new query helpers) ✅
- Phase 11: Rich Product Form + Approval Workflow (TipTap editor, product_status enum, review queue) 🚧 In Progress
- Phase 12: Product Review System 📋 Planned
- Phase 13: Media Manager (Supabase Storage) 📋 Planned

**Baseline: 332 tests passing | TypeScript: 0 errors | ESLint: 0 warnings**
