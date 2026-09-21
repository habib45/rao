# REVIEW.md — Code Review Guide for ORH Project

## Project Overview

**ORH / BestFinds** — Multi-locale Amazon Affiliate E-Commerce Platform  
**Stack:** Next.js 15 App Router | React 19 | TypeScript (strict) | MySQL API Gateway | Tailwind CSS v4 | Amazon PA-API 5.0  
**Locales:** `en` (default) | `bn-BD` (Bangla) | `sv` (Swedish)  
**Test Baseline:** 552 tests passing | 0 TypeScript errors | 0 ESLint warnings

---

## Code Review Checklist

### 1. Pre-Review Requirements

- [ ] Plan documents exist in `plan/phase-N/` directory
- [ ] Feature specifications reviewed and approved
- [ ] Test matrix document created
- [ ] Development phase status updated in `plan/DEVELOPMENT_PLAN.md`

### 2. TypeScript Compliance

- [ ] **No `any` types** — All types properly defined or use `unknown` with narrowing
- [ ] **Strict mode compliance** — All code passes `npx tsc --noEmit` with 0 errors
- [ ] **Type imports** — Use `import type` for type-only imports
- [ ] **Domain types** — New types added to `src/types/domain.ts` when appropriate
- [ ] **Path aliases** — Use `@/*` → `src/*` consistently

### 3. React / Next.js Standards

- [ ] **Server components by default** — Add `"use client"` only when needed (event handlers, hooks, browser APIs)
- [ ] **ISR configuration** — All public pages have `export const revalidate = 3600`
- [ ] **Static params** — All `[slug]` pages implement `generateStaticParams`
- [ ] **Metadata** — All pages implement `generateMetadata` (title, description, OG, hreflang)
- [ ] **Image optimization** — No raw `<img>` tags; always use `next/image` with explicit `width` and `height`
- [ ] **Dynamic imports** — Client-only components use `next/dynamic` with `ssr: false`

### 4. API Gateway Integration

- [ ] **Client usage** — Browser API calls use `src/lib/api/client.ts`
- [ ] **Server usage** — Server API calls use `src/lib/api/server.ts`
- [ ] **Consistent endpoints** — All data operations go through API Gateway endpoints
- [ ] **Error handling** — Proper error handling for API failures

### 5. Zod Validation

- [ ] **Input validation** — All POST/PATCH API route inputs validated with Zod before DB operations
- [ ] **Partial updates** — PATCH routes use `.partial()` for optional fields
- [ ] **Error responses** — Return 400 with `{ error: "Validation failed", issues: [...] }` on parse failure
- [ ] **Schema definitions** — Zod schemas defined in appropriate `_lib/schemas/` directories

### 6. Testing Standards

- [ ] **Test coverage** — New features include appropriate unit/integration tests
- [ ] **Vitest configuration** — Tests use jsdom environment
- [ ] **Cleanup** — Component tests use `afterEach(cleanup)` from `@testing-library/react`
- [ ] **Mocking** — `server-only` mocked via vitest alias: `"server-only": "./src/test/server-only.ts"`
- [ ] **Hoisted variables** — Use `vi.hoisted()` for variables referenced inside `vi.mock()` factories
- [ ] **API stubs** — API stubs must be thenable (explicit `then(resolve, reject)` method)
- [ ] **Middleware tests** — Partially mock `next/server` (replace `NextResponse.next`)

### 7. Admin Panel Specifics

- [ ] **Route structure** — Admin routes under `src/app/admin/` (NOT under `[locale]`)
- [ ] **Language** — Admin uses English only — no next-intl
- [ ] **Authentication** — Auth checks `app_metadata.role === "admin"` in middleware + `requireAdmin()`
- [ ] **UI components** — UI primitives are hand-built in `src/app/admin/_components/ui/` (no Radix/shadcn)
- [ ] **Data fetching** — TanStack Query for all client-side data fetching
- [ ] **Mutations** — All mutations go through API routes (not direct DB from client)

### 8. Styling Standards

- [ ] **Tailwind v4** — Use Tailwind CSS v4 with `@theme inline` custom properties
- [ ] **Dark mode** — Toggle via `.dark` class on `<html>` element
- [ ] **CSS variables** — Use defined variables: `--color-brand`, `--color-surface`, `--color-foreground`, `--color-muted`, `--color-border`
- [ ] **Class utility** — Use `cn()` utility from `src/app/admin/_lib/cn.ts` for class merging

### 9. Development Principles

#### Think Before Coding
- [ ] Assumptions stated explicitly
- [ ] Multiple interpretations presented (if applicable)
- [ ] Simpler approaches considered and discussed
- [ ] Unclear areas identified and clarified

#### Simplicity First
- [ ] No features beyond what was requested
- [ ] No abstractions for single-use code
- [ ] No unnecessary "flexibility" or "configurability"
- [ ] No error handling for impossible scenarios
- [ ] Code is concise (if 200 lines could be 50, it's rewritten)

#### Surgical Changes
- [ ] Only modified what was necessary
- [ ] No "improvements" to adjacent code, comments, or formatting
- [ ] No refactoring of unrelated code
- [ ] Matched existing style (even if different from personal preference)
- [ ] Removed only unused imports/variables/functions created by the changes
- [ ] Pre-existing dead code left untouched (unless specifically requested)

#### Goal-Driven Execution
- [ ] Success criteria clearly defined
- [ ] Changes verified against success criteria
- [ ] Multi-step tasks had brief plans stated
- [ ] Each step had verification checks

### 10. File Structure & Organization

- [ ] **Component placement** — Public components in `src/components/`, admin components in `src/app/admin/_components/`
- [ ] **Query helpers** — Database queries in `src/lib/queries/`
- [ ] **Type definitions** — Domain types in `src/types/domain.ts`
- [ ] **Admin utilities** — Admin-specific utilities in `src/app/admin/_lib/`
- [ ] **Test placement** — Tests co-located with source files in `__tests__/` directories

### 11. Security & Best Practices

- [ ] **No secrets in client** — Server-only variables never prefixed with `NEXT_PUBLIC_`
- [ ] **SQL injection** — All queries use parameterized statements via API Gateway
- [ ] **XSS prevention** — User content properly sanitized, TipTap content handled safely
- [ ] **Authentication** — Admin routes properly protected with JWT auth
- [ ] **Rate limiting** — API Gateway endpoints have appropriate rate limiting

### 12. Performance & SEO

- [ ] **ISR configuration** — Public pages use appropriate revalidation times
- [ ] **Image optimization** — All images use `next/image` with proper dimensions
- [ ] **Metadata** — SEO metadata complete (title, description, OG tags)
- [ ] **Structured data** — JSON-LD schemas included where appropriate
- [ ] **Loading states** — Appropriate loading states for async operations

---

## Quality Gates Verification

Before approving any PR, verify all quality gates pass:

```bash
# TypeScript compilation (must have 0 errors)
npx tsc --noEmit

# ESLint (must have 0 warnings)
npx eslint . --max-warnings 0

# All tests passing (baseline: 552 tests)
npx vitest run
```

### Quality Gate Checklist

- [ ] **TypeScript**: 0 compilation errors
- [ ] **ESLint**: 0 warnings
- [ ] **Tests**: All tests passing (no regressions)
- [ ] **Build**: Production build succeeds
- [ ] **Plan documents**: Updated and approved
- [ ] **Documentation**: Relevant docs updated (AGENT.md, CLAUDE.md, DEVELOPMENT_PLAN.md)

---

## Common Issues to Look For

### TypeScript Issues
- **`any` types** — Should be replaced with proper types or `unknown` with narrowing
- **Missing type imports** — Use `import type` for type-only imports
- **Implicit any** — Ensure strict mode catches all implicit any usage

### React Issues
- **Unnecessary `"use client"`** — Remove if no event handlers, hooks, or browser APIs
- **Missing `"use client"`** — Add if using useState, useEffect, event handlers, etc.
- **Missing ISR** — Public pages need `export const revalidate = 3600`
- **Raw `<img>` tags** — Replace with `next/image` components

### API Issues
- **Direct DB access from client** — All mutations must go through API routes
- **Missing Zod validation** — POST/PATCH inputs must be validated
- **Inconsistent error handling** — API errors should be handled consistently

### Testing Issues
- **Missing cleanup** — Component tests need `afterEach(cleanup)`
- **Improper mocking** — Use `vi.hoisted()` for variables in mock factories
- **Non-thenable stubs** — API stubs must have explicit `then(resolve, reject)` method

### Styling Issues
- **Hardcoded colors** — Use CSS variables instead
- **Inconsistent dark mode** — Ensure dark mode toggle works properly
- **Missing responsive classes** — Ensure components work on mobile

---

## Review Process

### 1. Initial Review
- Read the PR description and linked plan documents
- Verify plan documents exist and are approved
- Check that the scope matches the plan

### 2. Code Review
- Go through the Code Review Checklist systematically
- Run quality gates locally
- Test the changes if applicable

### 3. Feedback & Discussion
- Provide clear, actionable feedback
- Reference specific lines or files
- Explain why changes are needed
- Be open to discussion and alternative approaches

### 4. Approval
- Ensure all checklist items are complete
- Verify quality gates pass
- Confirm plan documents are updated
- Approve when ready for merge

---

## Pre-Merge Checklist

Before merging any changes:

- [ ] All code review items addressed
- [ ] Quality gates pass (TypeScript, ESLint, tests)
- [ ] Plan documents updated (`plan/DEVELOPMENT_PLAN.md`, phase plans)
- [ ] Test coverage maintained or improved
- [ ] No breaking changes to existing functionality
- [ ] Documentation updated (AGENT.md, CLAUDE.md, README.md if needed)
- [ ] Environment variables documented (if new ones added)
- [ ] Database migrations included (if schema changes)
- [ ] Dependencies updated (if new packages added)

---

## Phase-Specific Review Notes

### Phase 11: Rich Product Form + Approval Workflow
- [ ] TipTap editor properly integrated with all required extensions
- [ ] Product status workflow correctly implemented (draft → pending_review → approved → published)
- [ ] Review queue functionality working properly
- [ ] Rich text content properly sanitized and stored
- [ ] Multi-locale description fields working correctly

### Phase 19: Blog Wizard Component
- [ ] Wizard style controls properly implemented
- [ ] Multi-step tabs working correctly
- [ ] TipTap editor integration per step
- [ ] Style controls (border, shadow, panel borders) functional

### Phase 20: Product Comparison Wizard
- [ ] Inline comparison table rendering correctly
- [ ] "See More" expand functionality working
- [ ] Walmart-style layout implemented
- [ ] Mobile responsiveness verified

---

## Resources for Reviewers

- **[AGENT.md](AGENT.md)** — AI agent development guide
- **[CLAUDE.md](CLAUDE.md)** — Detailed project instructions
- **[DEVELOPMENT_PLAN.md](plan/DEVELOPMENT_PLAN.md)** — Master development plan
- **[README.md](README.md)** — General project information
- **Phase plans** — `plan/phase-N/PHASE_N_PLAN.md` for specific phase details

---

## Contact & Support

For questions about the review process or project standards:
- Refer to `AGENT.md` for development principles
- Refer to `CLAUDE.md` for code conventions
- Refer to phase plans for specific feature requirements
- Check `plan/DEVELOPMENT_PLAN.md` for current project status

---

**Remember**: The goal is to maintain code quality, consistency, and reliability while enabling efficient development. Be thorough but constructive in your reviews.
