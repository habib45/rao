# Phase 5 — Cart System

## Objective

Implement a localStorage-first cart that works for all visitors (no login required). Optionally syncs to Supabase `cart_items` when a user is authenticated. The cart state is global via React Context.

---

## Feature List

| ID | Feature | Priority | Complexity | Document |
|---|---|---|---|---|
| F5.1 | Cart Storage (localStorage + SSR safety) | P0 | Medium | [features/F5.1-cart-storage.md](features/F5.1-cart-storage.md) |
| F5.2 | CartProvider (React Context) | P0 | Medium | [features/F5.2-cart-provider.md](features/F5.2-cart-provider.md) |
| F5.3 | Cart Page | P0 | Medium | [features/F5.3-cart-page.md](features/F5.3-cart-page.md) |

---

## Dependency Order

```
F5.1 (localStorage helpers)
 └── F5.2 (CartProvider)
      └── F5.3 (Cart Page)
```

**Implementation order:** F5.1 → F5.2 → F5.3

---

## Acceptance Criteria (Phase 5 Complete When)

- [ ] Adding a product persists to localStorage immediately
- [ ] Cart state survives page refresh
- [ ] Cart count badge in Header updates instantly
- [ ] Cart page shows all items with quantity controls
- [ ] Remove item removes it from localStorage
- [ ] "Checkout on Amazon" opens affiliate URL per item
- [ ] SSR renders empty cart without hydration mismatch
- [ ] No TypeScript errors on cart types

---

## Test Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | storage.ts CRUD operations |
| Hook tests | Vitest + Testing Library | useCart hook add/remove/clear |
| Component tests | Vitest + Testing Library | CartProvider, cart item count badge |

---

## File Structure After Phase 5

```
src/lib/cart/
├── storage.ts          ← F5.1 — localStorage read/write helpers
└── CartProvider.tsx    ← F5.2 — React context + reducer

src/app/[locale]/
└── cart/
    └── page.tsx        ← F5.3 — Cart page
```
