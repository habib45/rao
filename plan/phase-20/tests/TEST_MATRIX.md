# Phase 20 — Test Matrix

## Unit tests

| ID | File | Test |
|---|---|---|
| T20.1 | comparison/index.test.ts | add() appends ID; max 5 enforced |
| T20.2 | comparison/index.test.ts | remove() deletes ID |
| T20.3 | comparison/index.test.ts | isSelected() returns correct boolean |
| T20.4 | comparison/index.test.ts | canAdd is false when 5 IDs stored |
| T20.5 | comparison/index.test.ts | persists to / restores from localStorage |
| T20.6 | AttributesEditor.test.tsx | renders key-value rows from initial attributes |
| T20.7 | AttributesEditor.test.tsx | add row appends empty pair |
| T20.8 | AttributesEditor.test.tsx | remove row calls onChange without that key |
| T20.9 | ComparisonKeysEditor.test.tsx | adds key, deduplicates |
| T20.10 | ComparisonKeysEditor.test.tsx | removes key via × button |
| T20.11 | ComparisonStep1.test.tsx | current product shown with "Viewing this item" |
| T20.12 | ComparisonStep1.test.tsx | +Add disabled when canAdd=false |
| T20.13 | ComparisonStep2.test.tsx | renders fixed rows (Brand, Price, Rating, Availability) |
| T20.14 | ComparisonStep2.test.tsx | renders dynamic keys from comparisonKeys prop |
| T20.15 | ComparisonStep2.test.tsx | missing attribute renders "—" |
| T20.16 | ComparisonStep3.test.tsx | renders AddToCartButton for each selected product |
