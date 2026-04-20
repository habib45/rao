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
                      └── Phase 7 (QA & Deploy)
```

---

## Phase 1 — Detailed Breakdown

See [phase-1/PHASE_1_PLAN.md](phase-1/PHASE_1_PLAN.md) for the full feature list, documents, and test cases.
