# Phase 15 — Test Matrix

## F15.1 Toggle Component
| ID | Description | Expected |
|---|---|---|
| T15-01 | Toggle renders unchecked state | Thumb positioned left, background muted |
| T15-02 | Toggle renders checked state | Thumb positioned right, background brand |
| T15-03 | Toggle onChange fires on click | Callback called with toggled value |
| T15-04 | Toggle disabled does not fire onChange | Callback not called |

## F15.2 Settings Query
| ID | Description | Expected |
|---|---|---|
| T15-05 | `getSiteSettings()` returns `showPrice: true` when no row in DB | Defaults to true |
| T15-06 | `getSiteSettings()` returns `showPrice: false` when DB has `features.show_price = false` | Returns false |
| T15-07 | Settings PATCH calls `revalidateTag("site-settings")` on success | revalidateTag mock called |

## F15.3 ProductCard
| ID | Description | Expected |
|---|---|---|
| T15-08 | ProductCard renders price when `showPrice` not passed (default) | Price visible |
| T15-09 | ProductCard renders price when `showPrice={true}` | Price visible |
| T15-10 | ProductCard hides price when `showPrice={false}` | Price block absent from DOM |
| T15-11 | ProductCard hides discount badge when `showPrice={false}` | Discount badge absent from DOM |
