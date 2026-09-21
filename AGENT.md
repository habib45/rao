# AGENT.md — AI Agent Guide for ORH Project

## Project Overview

**ORH** — Multi-locale Amazon Affiliate E-Commerce Platform  
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

**Critical Rules:**
- Never write code without plan documents
- No `any` types — use proper TypeScript
- Server components by default, add `"use client"` only when needed
- No raw `<img>` — always `next/image` with dimensions
- All POST/PATCH inputs validated with Zod
- ISR on all public pages: `export const revalidate = 3600`

**Related Documents:**
- Detailed instructions: `CLAUDE.md`
- Development plan: `plan/DEVELOPMENT_PLAN.md`

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

# Server-only (NEVER NEXT_PUBLIC_)
MYSQL_API_SECRET=
MYSQL_API_JWT_TOKEN=
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

## Important Implementation Details

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

## Contact & Support

For issues or questions about this project, refer to:
- `CLAUDE.md` — Detailed project instructions
- `plan/DEVELOPMENT_PLAN.md` — Master development plan
- `plan/phase-N/PHASE_N_PLAN.md` — Specific phase details
- `README.md` — General project information
