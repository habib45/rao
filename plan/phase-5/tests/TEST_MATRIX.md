# Phase 5 — Test Matrix

## Unit Tests: `src/lib/cart/__tests__/storage.test.ts`

| Test ID | Description | Expected |
|---|---|---|
| T5.1.1 | `loadCart()` returns [] when localStorage empty | `[]` |
| T5.1.2 | `loadCart()` returns [] on corrupted JSON | `[]` (no throw) |
| T5.1.3 | `addItem` stores new item with quantity 1 | item in storage |
| T5.1.4 | `addItem` increments quantity for duplicate productId | quantity=2 |
| T5.1.5 | `removeItem` removes correct item by productId | item gone |
| T5.1.6 | `updateQuantity(id, 0)` removes item | item gone |
| T5.1.7 | `updateQuantity(id, 5)` sets quantity to 5 | quantity=5 |
| T5.1.8 | `clearCart()` empties storage | `[]` |
| T5.1.9 | `loadCart()` does not throw in SSR env (no window) | returns `[]` |

## Component Tests: `src/lib/cart/__tests__/CartProvider.test.tsx`

| Test ID | Description | Expected |
|---|---|---|
| T5.2.1 | `useCart()` outside provider throws | Error thrown |
| T5.2.2 | `addItem` updates `itemCount` | count increases by 1 |
| T5.2.3 | `addItem` same product twice increments quantity | itemCount stays 1, quantity=2 |
| T5.2.4 | `removeItem` decrements itemCount | count decreases |
| T5.2.5 | `clearCart` resets itemCount to 0 | count=0 |
| T5.2.6 | `totalCents` correct for multiple items | sum correct |
