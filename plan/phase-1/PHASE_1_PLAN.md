# Phase 1 — Project Foundation & Setup

## Objective

Scaffold the Next.js 15 project with all foundational infrastructure: TypeScript types, Supabase client helpers, internationalization, and the root layout with conditional font loading. No pages or UI components yet — just the skeleton everything else builds on.

---

## Feature List

| ID | Feature | Priority | Complexity | Document |
|---|---|---|---|---|
| F1.1 | Project Initialization & Configuration | P0 | Low | [features/F1.1-project-init.md](features/F1.1-project-init.md) |
| F1.2 | TypeScript Domain Types | P0 | Medium | [features/F1.2-domain-types.md](features/F1.2-domain-types.md) |
| F1.3 | Supabase Client Setup | P0 | Medium | [features/F1.3-supabase-client.md](features/F1.3-supabase-client.md) |
| F1.4 | Internationalization (next-intl) | P0 | High | [features/F1.4-i18n.md](features/F1.4-i18n.md) |
| F1.5 | Root Layout & Font Loading | P0 | Medium | [features/F1.5-root-layout.md](features/F1.5-root-layout.md) |

All features are P0 (must-have) for Phase 1. No feature can be skipped.

---

## Dependency Order

```
F1.1 (Project Init)
 └── F1.2 (Domain Types)
      ├── F1.3 (Supabase Client)  ← uses types
      └── F1.4 (i18n)             ← uses LocaleCode type
           └── F1.5 (Root Layout) ← uses i18n + fonts
```

**Implementation order:** F1.1 → F1.2 → F1.3 → F1.4 → F1.5

---

## Acceptance Criteria (Phase 1 Complete When)

- [ ] `npm run dev` starts without errors
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] All domain types compile and are importable
- [ ] `createBrowserClient()` returns a typed Supabase client
- [ ] `createServerClient()` returns a typed Supabase client using cookies
- [ ] Navigating to `/en`, `/bn-BD`, `/sv` renders the correct locale layout
- [ ] Bengali font loads only on `/bn-BD/*` routes with line-height >= 1.7
- [ ] Locale switcher preserves the current path
- [ ] All environment variables are documented in `.env.example`
- [ ] 100% test coverage on all utility functions and configurations
- [ ] No secrets exposed in client-side code

---

## Test Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | Domain types, i18n helpers, format helpers, cart storage |
| Integration tests | Vitest + Testing Library | Supabase client creation, next-intl provider rendering |
| Config tests | Vitest | next.config validation, middleware locale detection |
| Type tests | tsd / expect-type | Domain type correctness, TranslationMap constraints |

Test files live in `plan/phase-1/tests/` during planning, then move to `__tests__/` or co-located `.test.ts` files during implementation.

---

## File Structure After Phase 1

```
src/
├── app/
│   ├── [locale]/
│   │   └── layout.tsx           ← F1.5
│   └── layout.tsx               ← Root layout (minimal)
├── lib/
│   ├── supabase/
│   │   ├── client.ts            ← F1.3
│   │   └── server.ts            ← F1.3
│   └── i18n/
│       ├── translate.ts         ← F1.4
│       └── format.ts            ← F1.4
├── types/
│   └── domain.ts                ← F1.2
├── messages/
│   ├── en.json                  ← F1.4
│   ├── bn-BD.json               ← F1.4
│   └── sv.json                  ← F1.4
├── middleware.ts                 ← F1.4
├── i18n.ts                      ← F1.4 (next-intl config)
next.config.ts                   ← F1.1
tailwind.config.ts               ← F1.1
tsconfig.json                    ← F1.1
.env.example                     ← F1.1
```
