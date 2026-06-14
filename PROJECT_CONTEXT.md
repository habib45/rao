# PROJECT_CONTEXT.md — ORH / BestFinds Project Context

## Project Identity

**Project Name:** ORH / BestFinds  
**Type:** Multi-locale Amazon Affiliate E-Commerce Platform  
**Primary Goal:** Display curated Amazon products, track affiliate clicks, redirect users to Amazon for purchase  
**Revenue Model:** Amazon Associates commission (no direct checkout, no payment processing)  
**Target Markets:** English (en), Bengali Bangladesh (bn-BD), Swedish (sv) markets

---

## Context Summary (30-Second Overview)

**What:** Multi-locale Amazon affiliate e-commerce platform  
**Stack:** Next.js 15, React 19, TypeScript (strict), MySQL, Tailwind CSS v4  
**Locales:** en, bn-BD, sv  
**Status:** 12 phases complete, 5 in progress, 4 planned  
**Test Baseline:** 332 tests passing  
**Key Feature:** MySQL data layer via API Gateway  
**Quality Gates:** tsc --noEmit, eslint, vitest run

**Related Documents:**
- AI agent guide: `AGENT.md`
- Detailed instructions: `CLAUDE.md`
- Development plan: `plan/DEVELOPMENT_PLAN.md`
- Project rules: `../.devin/RULES.md`
- Behavioral guidelines: `../.devin/SKILL.md`
- Context strategy: `../.devin/CONTEXT_STRATEGY.md`
- Decision trees: `../.devin/DECISION_TREES.md`
- Code patterns: `../.devin/PATTERNS.md`

---

## Business Context

### Value Proposition
- Curated product discovery across multiple locales
- Localized shopping experience (language, currency, product selection)
- SEO-driven content strategy (blog, comparison wizards, rich product descriptions)
- Affiliate revenue without inventory or fulfillment complexity

### Target Users
- **Shoppers:** Multi-language users looking for product recommendations and deals
- **Admins:** Content managers who curate products, write blog posts, manage translations
- **Affiliates:** Platform owners earning Amazon Associates commission

### Key Differentiators
- Multi-locale support with proper i18n infrastructure
- Rich content (blog posts, comparison wizards, detailed product descriptions)
- SEO-optimized with sitemaps, structured data, and performance optimization
- MySQL data layer via API Gateway
- Admin panel with approval workflows, scheduling, and analytics

---

## Technical Context

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  (App Router, Server Components, ISR, Multi-locale)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌───────────────────┐
              │  MySQL API        │
              │  Gateway          │
              │  (Express.js)     │
              └───────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  MySQL 8.0      │
              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Amazon PA-API  │
              │  5.0            │
              └─────────────────┘
```

### Data Layer

The project uses MySQL API Gateway as the data layer:
- Express.js REST API on port 4000
- MySQL 8.0 database
- JWT-based authentication
- All data operations go through API Gateway endpoints

---

## Codebase Structure

### Frontend (Next.js 15)

**Public Storefront** (`src/app/[locale]/`)
- Homepage with hero, categories, featured products
- Product listing with filters and pagination
- Product detail pages with rich descriptions
- Category pages
- Search functionality
- Cart system (localStorage-first)
- Blog system (posts, categories, tags, comments)
- Comparison wizards

**Admin Panel** (`src/app/admin/`)
- Dashboard with analytics charts
- Products CRUD with approval workflow
- Categories management
- Blog management (posts, categories, tags, comments)
- Media managers (public folder)
- Translation editor
- Settings management
- Sitemap management
- Review queues (products, comments)

**Shared Components** (`src/components/`)
- Header, Footer
- ProductCard
- Wizard/Comparison blocks
- Rich text editors (TipTap, CKEditor)

**Libraries** (`src/lib/`)
- API Gateway client factories (browser, server)
- Amazon PA-API client with SigV4 signing
- Cart context and localStorage helpers
- i18n translation helpers
- Query helpers for API Gateway
- Wizard/comparison block utilities

### Backend

**MySQL API Gateway** (`apiGateWay/`)
- Express.js REST API
- JWT authentication
- Admin panel with token management
- Full CRUD for all entities
- Analytics endpoints
- PA-API integration for product sync
- Click tracking
- Search

---

## Database Schema

### Core Tables (MySQL)

1. **categories** - Product categories with multi-locale names
2. **products** - Products with multi-locale metadata, pricing, status workflow
3. **product_images** - Product image URLs
4. **click_tracking** - Affiliate click events with analytics
5. **cart_items** - Cart persistence (optional for authenticated users)
6. **translations_ui** - UI translations for admin panel
7. **price_history** - Price change history
8. **admin_settings** - Key-value configuration store
9. **sync_logs** - Background job execution logs
10. **blog_posts** - Blog posts with multi-locale metadata
11. **blog_categories** - Blog categories
12. **blog_tags** - Blog tags
13. **blog_post_tags** - Post-tag relationships
14. **blog_post_views** - View tracking
15. **blog_comments** - User comments with moderation
16. **sitemap_custom_entries** - Custom sitemap URLs
17. **jwt_tokens** - API Gateway JWT tokens
18. **admin_users** - Admin panel users
19. **audit_logs** - Security audit trail
20. **password_reset_tokens** - Password reset tokens

### Key Design Patterns

- **Multi-locale fields:** JSONB `TranslationMap` structure
- **Status workflows:** Enum-based status (draft → pending_review → approved → published)
- **Soft deletes:** `is_active` flag instead of row deletion
- **Audit trails:** `created_at`, `updated_at` timestamps on all tables
- **Indexing:** GIN indexes on JSONB/tsvector columns for performance

---

## Development Workflow

### Phase-Based Development

The project is organized into 21+ phases, each with:
- Detailed plan document (`plan/phase-N/PHASE_N_PLAN.md`)
- Feature specifications (`plan/phase-N/features/FN.X-name.md`)
- Test matrix (`plan/phase-N/tests/TEST_MATRIX.md`)
- Acceptance criteria
- File structure

### Quality Gates

Every phase must pass:
```bash
npx tsc --noEmit           # 0 TypeScript errors
npx eslint . --max-warnings 0   # 0 ESLint warnings
npx vitest run             # All tests passing
```

### Planning First Rule

**Never write code before plan documents exist:**
1. Update `plan/DEVELOPMENT_PLAN.md`
2. Create/update `plan/phase-N/PHASE_N_PLAN.md`
3. Write feature documents
4. Write test matrix
5. THEN begin coding

---

## Current State

### Completed Phases (✅)
- Phase 1-10: Foundation through Public UI Redesign
- Phase 19: Blog Wizard Component
- Phase 20: Product Comparison Wizard

### In Progress (🚧)
- Phase 11: Rich Product Form + Approval Workflow
- Phase 14: Blog System (SEO-Driven)
- Phase 15: Admin Settings: Price Display Toggle
- Phase 18: Blog Enhancements
- Phase 21: Public Folder Media Manager

### Planned (📋)
- Phase 12: Product Review System
- Phase 13: Media Manager (File System)
- Phase 16: Related Content Sections
- Phase 17: Admin Sitemap Management

### Test Baseline
- **332 tests passing**
- **0 TypeScript errors**
- **0 ESLint warnings**

---

## Key Features

### Public Storefront
- Multi-locale product browsing
- Advanced product search and filtering
- Product comparison wizards
- SEO-optimized blog system
- Cart with localStorage persistence
- Responsive design with dark mode
- **SEO Optimization**:
  - Comprehensive metadata with keywords, authors, publisher
  - Dynamic sitemap with priority and changeFrequency
  - Structured data (Organization, Product, Article, BreadcrumbList, CollectionPage, ContactPage)
  - OpenGraph and Twitter card optimization
  - HTTPS enforcement middleware
  - Core Web Vitals optimization (WebP/AVIF images, Brotli/Gzip compression, asset caching)
  - E-E-A-T trust signals (About page, Contact page, trust badges)

### Admin Panel
- Dashboard with analytics
- Product management with approval workflow
- Blog content management
- Media management (cloud + local)
- Translation editor
- Settings management
- Sitemap control
- Review queues

### Integration
- Amazon PA-API 5.0 for product data
- AI integration (Gemini, OpenAI, Groq) for content generation
- Multi-locale support with proper i18n
- MySQL data layer via API Gateway

---

## Configuration

### Environment Variables

**Public (client-safe):**
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_MYSQL_API_URL`
- `NEXT_PUBLIC_MYSQL_API_JWT_TOKEN`

**Server-only (secret):**
- `MYSQL_API_SECRET`
- `MYSQL_JWT_SECRET`
- `AMAZON_ACCESS_KEY`
- `AMAZON_SECRET_KEY`
- `AMAZON_PARTNER_TAG`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`

**Configuration:**
- `NODE_ENV`
- `PORT`

---

## Deployment

### Recommended: Vercel + API Gateway
- Next.js deployed to Vercel
- API Gateway for database operations
- ISR caching for performance
- Environment variables in Vercel dashboard

### Alternative: VPS/Docker + MySQL
- MySQL API Gateway for data layer
- Next.js with PM2 process management
- nginx reverse proxy
- Filesystem-based media manager

### Local Development
```bash
npm run dev          # Next.js dev server (port 3000)
npm run test         # Vitest tests
npm run lint         # ESLint
npm run build        # Production build
```

---

## Dependencies

### Core Framework
- next 15.5.15
- react 19.1.0
- typescript 5

### Styling
- tailwindcss 4
- clsx, tailwind-merge

### Database & Backend
- mysql2 (for API Gateway)

### Internationalization
- next-intl 3.26.5

### Validation
- zod 4.3.6

### Admin Panel
- @tanstack/react-query 5.99.2
- recharts 3.8.1
- sonner 2.0.7
- lucide-react 1.8.0

### Rich Text Editors
- @tiptap/react 3.22.4 (TipTap suite)
- ckeditor5 48.2.0
- @ckeditor/ckeditor5-react 11.1.2

### AI Integration
- @google/generative-ai 0.24.1
- openai 6.41.0
- groq-sdk 1.2.1

### Testing
- vitest 2.1.9
- @testing-library/react 16.3.2
- @vitejs/plugin-react 4.3.1

---

## Risk Mitigation

### Technical Risks
- **PA-API rate limiting:** Exponential backoff, batch limits
- **Stale prices:** ISR revalidation, price history tracking
- **Performance:** GIN indexes, ISR caching, image optimization
- **Secret exposure:** Vault storage, no NEXT_PUBLIC_ prefix on secrets

### Business Risks
- **Amazon TOS compliance:** No direct checkout, affiliate disclosure
- **Content quality:** Approval workflow, review queues
- **SEO:** Structured data, sitemaps, performance optimization

---

## Documentation

### Key Documents
- `AGENT.md` — AI agent development guide
- `CLAUDE.md` — Detailed project instructions
- `plan/DEVELOPMENT_PLAN.md` — Master development plan
- `plan/phase-N/PHASE_N_PLAN.md` — Phase-specific plans
- `README.md` — General project information
- `deployment.md` — Deployment instructions

### Code Documentation
- TypeScript types in `src/types/domain.ts`
- JSDoc comments on complex functions
- Feature documents in `plan/phase-N/features/`
- Test matrices in `plan/phase-N/tests/`

---

## Team & Collaboration

### Development Principles
1. **Think before coding** — State assumptions, ask when uncertain
2. **Simplicity first** — No speculative features or abstractions
3. **Surgical changes** — Touch only what's necessary
4. **Goal-driven execution** — Define success criteria, loop until verified

### Code Review Focus
- TypeScript strict mode compliance
- ESLint warnings
- Test coverage
- Security (no secrets in client bundle)
- Performance (ISR, image optimization)
- Accessibility (semantic HTML, ARIA labels)

---

## Future Roadmap

### Near Term (In Progress)
- Complete Phase 11: Product approval workflow
- Complete Phase 14: Blog system
- Complete Phase 21: Public media manager

### Medium Term (Planned)
- Phase 12: Product review system
- Phase 13: File System media manager
- Phase 16: Related content sections
- Phase 17: Sitemap management

### Long Term (Potential)
- Advanced analytics dashboard
- Email notifications
- Social sharing integration
- Price alerts
- User accounts and wishlists
- Mobile app (React Native)

---

## Contact & Support

For development questions:
- Refer to `AGENT.md` for AI agent guidance
- Refer to `CLAUDE.md` for detailed instructions
- Refer to phase plans for specific feature details
- Check test matrices for acceptance criteria
