# Phase 1 — Test Matrix

## Overview

| Feature | Test File | Unit | Integration | Edge Case | Failure | Security | Total |
|---|---|---|---|---|---|---|---|
| F1.1 Project Init | F1.1-project-init.test-plan.md | 3 | 2 | 1 | 1 | 0 | 7 |
| F1.2 Domain Types | F1.2-domain-types.test-plan.md | 11 | 0 | 3 | 2 | 0 | 16 |
| F1.3 Supabase Client | F1.3-supabase-client.test-plan.md | 5 | 2 | 4 | 2 | 2 | 15 |
| F1.4 i18n | F1.4-i18n.test-plan.md | 18 | 5 | 4 | 0 | 0 | 27 |*
| F1.5 Root Layout | F1.5-root-layout.test-plan.md | 5 | 7 | 3 | 3 | 0 | 18 |*
| **Total** | | **42** | **16** | **15** | **8** | **2** | **83** |

*Some tests span multiple sub-categories (translate, format, middleware, messages)

---

## Test IDs Quick Reference

### F1.1 — Project Init
- TC-1.1.1: TypeScript compilation passes
- TC-1.1.2: Path alias @/* resolves
- TC-1.1.3: Environment variables documented
- TC-1.1.4: Vitest configuration loads
- TC-1.1.5: Tailwind CSS processes utility classes
- TC-1.1.6: No secrets in source code
- TC-1.1.7: Missing dependency graceful error

### F1.2 — Domain Types
- TC-1.2.1: LocaleCode is exactly 3 values
- TC-1.2.2: TranslationMap accepts partial locales
- TC-1.2.3: TranslationMap generic type parameter
- TC-1.2.4: Product interface enforces required fields
- TC-1.2.5: Product.price_cents allows null
- TC-1.2.6: ProductAvailability is a closed union
- TC-1.2.7: ProductImage interface shape
- TC-1.2.8: Category interface shape
- TC-1.2.9: CartItem wraps Product with quantity
- TC-1.2.10: ClickEvent interface shape
- TC-1.2.11: PriceHistoryEntry interface shape
- TC-1.2.12: Empty TranslationMap at runtime
- TC-1.2.13: Product with all nullable fields null
- TC-1.2.14: Product.discount_pct is number
- TC-1.2.15: Typo in locale code
- TC-1.2.16: Wrong type for price_cents

### F1.3 — Supabase Client
- TC-1.3.1: createBrowserClient returns client
- TC-1.3.2: createBrowserClient reads env vars
- TC-1.3.3: createServerClient returns client
- TC-1.3.4: Server client integrates with cookies
- TC-1.3.5: Server client handles cookie write errors
- TC-1.3.6: Browser client can call .from()
- TC-1.3.7: Server client can call .from()
- TC-1.3.8: Missing SUPABASE_URL
- TC-1.3.9: Missing SUPABASE_ANON_KEY
- TC-1.3.10: Multiple sequential server client calls
- TC-1.3.11: Empty cookie store
- TC-1.3.12: Invalid Supabase URL format
- TC-1.3.13: Server client import in client component
- TC-1.3.14: No service role key in client modules
- TC-1.3.15: Only NEXT_PUBLIC_ env vars used

### F1.4 — i18n
- TC-1.4.1–1.4.10: t() helper (10 tests)
- TC-1.4.11–1.4.21: formatPrice() (11 tests)
- TC-1.4.22–1.4.26: Middleware locale detection (5 tests)
- TC-1.4.27–1.4.32: Message file completeness (6 tests)

### F1.5 — Root Layout
- TC-1.5.1–1.5.5: HTML attributes (5 tests)
- TC-1.5.6–1.5.8: Font loading (3 tests)
- TC-1.5.9–1.5.10: Provider integration (2 tests)
- TC-1.5.11–1.5.12: Metadata (2 tests)
- TC-1.5.13–1.5.14: Affiliate disclosure (2 tests)
- TC-1.5.15–1.5.17: Edge cases (3 tests)
- TC-1.5.18–1.5.20: Failure scenarios (3 tests)

---

## TDD Implementation Order

Tests must be written and run (failing) BEFORE implementation:

1. **F1.2 type tests** → implement `types/domain.ts`
2. **F1.4 translate + format tests** → implement `lib/i18n/translate.ts` + `lib/i18n/format.ts`
3. **F1.3 supabase tests** → implement `lib/supabase/client.ts` + `lib/supabase/server.ts`
4. **F1.4 middleware + message tests** → implement `middleware.ts` + `messages/*.json`
5. **F1.5 layout tests** → implement `app/[locale]/layout.tsx`
6. **F1.1 config tests** → verify project config (run last as meta-tests)

---

## Coverage Targets

| Metric | Target |
|---|---|
| Line coverage | 100% |
| Branch coverage | 100% |
| Function coverage | 100% |
| Statement coverage | 100% |

Run with: `npx vitest run --coverage`
