# Phase 20 — Product Comparison Wizard

## Goal
Inline product comparison widget on the product detail page.  
Users pick up to 6 products (from same-category candidates), step through a 3-step wizard, view a dynamic attribute table, and add items to cart — all without leaving the page.

## Scope decisions
| Decision | Choice |
|---|---|
| Trigger location | Product detail page only (inline section) |
| Layout | Inline scrollable section — no modal, no separate route |
| Attribute source | Admin-defined comparison keys (admin_settings key `comparison`) |
| Max products | 6 (including the current product) |
| Wizard flow | True 3-step: Select → Compare table → Add to cart |
| "+ Add" button | Adds to cart (existing AddToCartButton) |
| Admin product form | Attributes key-value editor + `show_in_comparison` toggle |

## Features

| ID | Feature | Status |
|---|---|---|
| F20.1 | DB migration — `show_in_comparison` column + `comparison` settings seed | ✅ |
| F20.2 | Admin Settings — ComparisonKeysEditor card | ✅ |
| F20.3 | Admin Product Form — AttributesEditor + show_in_comparison toggle | ✅ |
| F20.4 | Comparison context — localStorage IDs, max 6 | ✅ |
| F20.5 | Comparison Wizard UI — 3-step, inline on product detail page | ✅ |

## File structure

```
supabase/migrations/
  00020_comparison.sql                     ← new column + settings seed

src/
  types/domain.ts                          ← add show_in_comparison: boolean
  lib/
    queries/
      settings.ts                          ← add getComparisonKeys()
      comparison.ts                        ← getComparisonCandidates()
    comparison/
      index.ts                             ← ComparisonContext + useComparison hook

  app/
    admin/
      settings/_components/
        ComparisonKeysEditor.tsx           ← new
        SettingsForm.tsx                   ← add comparison card
      products/
        _components/
          AttributesEditor.tsx             ← new (shared create/edit)
        [id]/_components/
          ProductEditForm.tsx              ← add AttributesEditor + toggle
        new/_components/
          ProductCreateForm.tsx            ← same

    [locale]/
      layout.tsx                           ← wrap with ComparisonProvider
      products/[slug]/
        _components/
          ComparisonWizard.tsx             ← wizard container (client)
          ComparisonStep1.tsx              ← product selector
          ComparisonStep2.tsx              ← comparison table
          ComparisonStep3.tsx              ← cart actions
        page.tsx                           ← pass candidates + keys as props
```

## Acceptance criteria

- [x] Admin can add/remove/reorder comparison keys in settings
- [x] Product form shows key-value attribute editor and show_in_comparison toggle
- [x] Comparison section appears below product on detail page
- [x] Current product is always shown; cannot be removed
- [x] Up to 5 additional products can be added (6 total)
- [x] Step 2 table shows: Brand, Price, Rating, Availability + all admin-defined keys
- [x] Missing attribute values display "—"
- [x] Step 3 shows AddToCartButton per selected product
- [x] Selection persists in localStorage across navigations within same category
- [x] TypeScript: 0 errors | ESLint: 0 warnings | 475 tests passing
