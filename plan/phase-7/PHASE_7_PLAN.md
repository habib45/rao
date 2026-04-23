# Phase 7 — Testing, QA & Deployment

## Objective

Harden the platform with a full test suite, perform a security audit, set up CI/CD, and deploy to production. No new features — this phase focuses entirely on quality and production readiness.

---

## Feature List

| ID | Feature | Priority | Complexity | Document |
|---|---|---|---|---|
| F7.1 | Full Vitest Test Suite | P0 | High | [features/F7.1-test-suite.md](features/F7.1-test-suite.md) |
| F7.2 | Security Audit | P0 | Medium | [features/F7.2-security-audit.md](features/F7.2-security-audit.md) |
| F7.3 | CI/CD Pipeline (GitHub Actions) | P0 | Medium | [features/F7.3-cicd.md](features/F7.3-cicd.md) |
| F7.4 | Production Deployment | P0 | High | [features/F7.4-deployment.md](features/F7.4-deployment.md) |

---

## Dependency Order

```
All prior phases (1–6) complete
 ├── F7.1 (tests can now be written for all features)
 ├── F7.2 (security audit requires complete codebase)
 ├── F7.3 (CI/CD runs after tests pass locally)
 └── F7.4 (deploy after CI passes)
```

---

## Acceptance Criteria (Phase 7 Complete When)

- [ ] `npx vitest run` passes all tests (0 failures)
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx eslint . --max-warnings 0` — zero warnings
- [ ] No Amazon keys or Supabase service role key in client bundle
- [ ] GitHub Actions workflow passes on every PR and push to main
- [ ] Production URL accessible and all 3 locales load
- [ ] Supabase Edge Functions deployed and responding
- [ ] ISR verified via `x-nextjs-cache: STALE` on second request
- [ ] SSL certificate active, no mixed-content warnings

---

## File Structure After Phase 7

```
.github/
└── workflows/
    ├── ci.yml         ← F7.3 — test + lint + typecheck
    └── deploy.yml     ← F7.3 — Vercel production deploy

src/__tests__/
├── middleware.test.ts ← Updated with all locale + admin routes
└── integration/
    ├── homepage.test.tsx
    └── product-detail.test.tsx
```
