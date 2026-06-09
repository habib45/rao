# AGENT.md — AI Agent Guide for ORH / BestFinds Project

## Project Overview

**ORH / BestFinds** — Multi-locale Amazon Affiliate E-Commerce Platform  
**Purpose:** Display curated Amazon products, track affiliate clicks, redirect users to Amazon for purchase  
**Revenue Model:** Amazon Associates commission (no direct checkout)  
**Stack:** Next.js 15 App Router | React 19 | TypeScript (strict) | MySQL | Tailwind CSS v4 | Amazon PA-API 5.0  
**Locales:** `en` (default) | `bn-BD` (Bangla) | `sv` (Swedish)  
**Data Source:** MySQL via API Gateway

---

## Quick Start (Read This First)

**Quality Gates (Must Pass Before Completing Any Work):**
```bash
npx tsc --noEmit           # 0 TypeScript errors
npx eslint . --max-warnings 0   # 0 ESLint warnings
npx vitest run             # All tests passing (baseline: 332 tests)
```

**Before Coding (MANDATORY):**
1. Check `plan/DEVELOPMENT_PLAN.md` for current phase status
2. Read `plan/phase-N/PHASE_N_PLAN.md` for the phase you're working on
3. Review feature documents in `plan/phase-N/features/`
4. Check test matrix in `plan/phase-N/tests/TEST_MATRIX.md`
5. Get approval before coding

**Key File Locations:**
- Types: `src/types/domain.ts`
- API Gateway client: `src/lib/api/` (client.ts, server.ts)
- Query helpers: `src/lib/queries/`
- Admin panel: `src/app/admin/`
- Public storefront: `src/app/[locale]/`
- Shared components: `src/components/`
- Phase plans: `plan/phase-N/`

**Current Status (June 2026):**
- Completed: 12 phases (1-10, 19, 20)
- In Progress: 5 phases (11, 14, 15, 18, 21)
- Planned: 4 phases (12, 13, 16, 17)
- Test Baseline: 332 tests passing

**Critical Rules:**
- Never write code without plan documents
- No `any` types — use proper TypeScript
- Server components by default, add `"use client"` only when needed
- No raw `<img>` — always `next/image` with dimensions
- All POST/PATCH inputs validated with Zod
- ISR on all public pages: `export const revalidate = 3600`

**Related Documents:**
- Detailed instructions: `CLAUDE.md`
- Project context: `PROJECT_CONTEXT.md`
- Development plan: `plan/DEVELOPMENT_PLAN.md`
- Project rules: `../.devin/RULES.md`
- Behavioral guidelines: `../.devin/SKILL.md`

---

## Critical Development Workflow (MANDATORY)

Before coding any phase or feature, follow this sequence:

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
npx vitest run             # All tests must pass (baseline: 332 tests)
```

---

## Tech Stack Details

### Frontend Framework
- **Next.js 15.5.15** with App Router
- **React 19.1.0** with Server Components by default
- **TypeScript 5** with strict mode enabled

### Styling
- **Tailwind CSS v4** with `@theme inline` custom properties
- CSS variables: `--color-brand`, `--color-surface`, `--color-foreground`, `--color-muted`, `--color-border`
- Dark mode: `.dark` class on `<html>` element

### Database & Backend
- **MySQL API Gateway** (Express.js on port 4000)

### Internationalization
- **next-intl 3.26.5** for 3-locale support
- Translation files in `messages/` directory
- Bengali font: Noto Sans Bengali (loaded conditionally)

### Validation & Forms
- **Zod 4.3.6** for schema validation
- All API route inputs validated before DB operations

### Admin Panel
- **@tanstack/react-query 5.99.2** for client-side data fetching
- **recharts 3.8.1** for analytics charts
- **sonner 2.0.7** for toast notifications
- **lucide-react 1.8.0** for icons
- Hand-built UI primitives (no Radix/shadcn)

### Rich Text Editors
- **TipTap 3.22.4** for product/blog content editing
- **CKEditor 5 48.2.0** for blog wizard components

### AI Integration
- **@google/generative-ai 0.24.1** (Gemini)
- **openai 6.41.0**
- **groq-sdk 1.2.1**

### Testing
- **Vitest 2.1.9** with jsdom environment
- **@testing-library/react 16.3.2**
- **@vitejs/plugin-react 4.3.1**

---

## Code Conventions

### TypeScript
- Strict mode always on
- Path alias: `@/*` → `src/*`
- No `any` — use proper types or `unknown` with narrowing
- Domain types in `src/types/domain.ts`
- Use `import type` for type-only imports

### React / Next.js
- Server components by default; add `"use client"` only when needed (event handlers, hooks, browser APIs)
- ISR on all public pages: `export const revalidate = 3600`
- `generateStaticParams` on all `[slug]` pages
- `generateMetadata` on every page (title, description, OG, hreflang)
- No raw `<img>` — always `next/image` with explicit `width` and `height`
- Use `next/dynamic` for client-only components with `ssr: false`

### API Gateway
- Browser client: `src/lib/api/client.ts`
- Server client: `src/lib/api/server.ts`
- All API calls go through API Gateway endpoints

### Zod Validation
- All API route inputs validated with Zod before any DB operation
- Use `.partial()` for PATCH routes
- Return 400 with `{ error: "Validation failed", issues: [...] }` on parse failure

### Testing (Vitest)
- Vitest with jsdom environment
- `@testing-library/react` with `afterEach(cleanup)`
- Mock `server-only` via vitest alias: `"server-only": "./src/test/server-only.ts"`
- Use `vi.hoisted()` for variables referenced inside `vi.mock()` factories
- API stubs must be thenable (explicit `then(resolve, reject)` method)
- Partially mock `next/server` for middleware tests (replace `NextResponse.next`)

### Admin Panel Specifics
- Admin routes live under `src/app/admin/` (NOT under `[locale]`)
- Admin uses English only — no next-intl
- Auth: `app_metadata.role === "admin"` checked in middleware + `requireAdmin()`
- UI primitives are hand-built in `src/app/admin/_components/ui/` (no Radix/shadcn)
- TanStack Query for all client-side data fetching in admin
- All mutations go through API routes

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
│   │   ├── cart/
│   │   └── blog/
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
│   ├── queries/           ← API Gateway query helpers
│   ├── wizard/            ← Wizard/comparison block utilities
│   └── api/              ← API Gateway client factories
├── types/domain.ts        ← All domain TypeScript types
├── middleware.ts           ← next-intl + admin JWT auth gate
└── test/server-only.ts    ← Vitest stub for server-only package

plan/                      ← Phase plans (read before coding!)
├── DEVELOPMENT_PLAN.md
├── phase-1/ through phase-21/
│   ├── PHASE_N_PLAN.md
│   ├── features/
│   └── tests/
```

---

## Environment Variables

```env
# Public (safe in client bundle)
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_MYSQL_API_URL=
NEXT_PUBLIC_MYSQL_API_JWT_TOKEN=

# Server-only (NEVER NEXT_PUBLIC_)
MYSQL_API_SECRET=
MYSQL_JWT_SECRET=

# Amazon PA-API
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_PARTNER_TAG=
AMAZON_HOST=webservices.amazon.com

# AI API Keys
GEMINI_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=

# Server Config
NODE_ENV=production
PORT=3000
```

---

## Completed Phases

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
- Phase 19: Blog Wizard Component (multi-step tabs, CKEditor per step, full style controls) ✅
- Phase 20: Product Comparison Wizard (inline comparison table, See More expand, Walmart-style layout) ✅

**In Progress:**
- Phase 11: Rich Product Form + Approval Workflow (TipTap editor, product_status enum, review queue) 🚧
- Phase 14: Blog System (SEO-Driven) 🚧
- Phase 15: Admin Settings: Price Display Toggle 🚧
- Phase 18: Blog Enhancements (Pagination, Filtering, Newsletter, Comments) 🚧
- Phase 21: Public Folder Media Manager 🚧

**Planned:**
- Phase 12: Product Review System 📋
- Phase 13: Media Manager (File System) 📋
- Phase 16: Related Content Sections (Blog & Product Detail) 📋
- Phase 17: Admin Sitemap Management 📋

**Baseline: 332 tests passing | TypeScript: 0 errors | ESLint: 0 warnings**

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Rendering strategy | ISR (no pure SSR) | Static HTML for CWV; prices stay fresh via revalidation |
| Cart storage | localStorage-first | Works for guests; no auth required for browsing |
| Translated fields | JSONB TranslationMap | Single row per entity; GIN-indexable; no JOIN overhead |
| Price storage | Integer cents | Avoids floating-point precision errors |
| API key security | Edge Functions only | Amazon keys never touch client bundle |
| Search | PostgreSQL tsvector | Native FTS per locale; no external search service |
| Checkout | Amazon redirect | Required by Amazon Associates TOS |
| Data source | MySQL via API Gateway | Consistent data layer across deployments |

---

## Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R1 | PA-API rate limiting blocks sync | Medium | High | 1.1s delay between calls; exponential backoff on 429; batch max 10 ASINs |
| R2 | Amazon TOS violation | Low | Critical | Prices refreshed < 24h; no direct checkout; display affiliate disclosure |
| R3 | Stale prices displayed | Medium | Medium | ISR revalidation 1h; "Price as of" disclaimer; price_history audit trail |
| R4 | Bengali font fails to load | Low | Medium | Noto Sans Bengali via next/font with display:swap; CSS fallback chain |
| R5 | Missing translations break UI | Medium | Medium | t() helper always falls back to en; translation completeness checks |
| R6 | Secret key exposure | Low | Critical | All secrets in environment variables; CI grep check; no NEXT_PUBLIC_ prefix on secrets |
| R7 | JSONB query performance at scale | Low | Medium | GIN indexes; tsvector for FTS; locale-specific key path queries |
| R8 | Cart data loss on browser clear | Medium | Low | Optional API sync for auth'd users; cart_items table |
| R9 | Click fraud inflating analytics | Medium | Low | ip_hash + session dedup; rate limiting on inserts |
| R10 | Product delisted on Amazon | Medium | Low | is_active=false after 3 failed lookups; "Currently unavailable" UI |

---

## Development Principles

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- When your changes create orphans, remove imports/variables/functions that YOUR changes made unused.

### 4. Goal-Driven Execution
- Define success criteria. Loop until verified.
- Transform tasks into verifiable goals.
- For multi-step tasks, state a brief plan.

---

## Important Notes

### Wizard/Comparison Block System
- `src/lib/wizard.ts` contains `WizardData` / `WizardStep` types
- Supports both wizard blocks (multi-step tabs) and comparison blocks
- Used in BlogPostForm, ProductEditForm, ProductCreateForm
- Style controls: border color/size, shadow, panel borders, footer visibility

### Data Source Implementation
- All API calls go through API Gateway endpoints
- This allows the same Next.js codebase to work with either backend

### Admin Panel Auth
- Uses JWT with `role === "admin"`
- Middleware enforces auth on all `/admin/*` routes
- Service role client used for admin operations (bypasses RLS)

### Blog System
- Content is English-only (TEXT field) per user decision
- Metadata fields (title, slug, excerpt) are multi-locale JSONB
- Uses TipTap for rich text editing
- Includes categories, tags, comments, and view tracking

### Product Workflow
- Status enum: `draft | pending_review | approved | published`
- Rejection with reason supported
- Scheduled publishing via `publish_at` timestamp
- Review queue for pending products

---

## Testing Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | Domain types, i18n helpers, format helpers, cart storage, schemas |
| Integration tests | Vitest + Testing Library | API client creation, next-intl provider rendering, API routes |
| Component tests | Vitest + Testing Library | React components, admin UI primitives |
| Config tests | Vitest | next.config validation, middleware locale detection |
| Type tests | tsd / expect-type | Domain type correctness, TranslationMap constraints |

Test files live in `__tests__/` directories or co-located `.test.ts` files.

---

## Deployment Notes

### Vercel (Recommended)
- PA-API integration via API Gateway Edge Functions
- Next.js deploy via Vercel
- Environment variables in Vercel dashboard
- ISR caching enabled

### VPS/Docker
- Use MySQL API Gateway for data layer
- Run Next.js with `npm start`
- Use PM2 or similar for process management
- Configure nginx reverse proxy

### Local Development
```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run test         # Run Vitest tests
npm run lint         # Run ESLint
npm run build        # Production build
```

---

## Contact & Support

For issues or questions about this project, refer to:
- `CLAUDE.md` — Detailed project instructions
- `plan/DEVELOPMENT_PLAN.md` — Master development plan
- `plan/phase-N/PHASE_N_PLAN.md` — Specific phase details
- `README.md` — General project information
