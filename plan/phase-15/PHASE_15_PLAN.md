# Phase 15 — Admin Settings: Site-wide Price Display Toggle

**Status:** In Progress
**Dependencies:** Phase 8 (admin shell, settings page, admin_settings table), Phase 10 (public ProductCard)

---

## Overview

Phase 15 adds a **Price Display** toggle to the admin Settings page. When the toggle is turned **off**, product prices are hidden across every page of the public storefront (product listing, homepage, product detail, search results). The setting is stored in the existing `admin_settings` table under the `features` JSON key and is read on the server via a cached query helper.

---

## Features

| # | Feature | Document |
|---|---|---|
| 15.1 | Admin toggle UI + SettingsForm update | [features/F15.1-admin-toggle.md](features/F15.1-admin-toggle.md) |
| 15.2 | Public-side settings query helper | [features/F15.2-settings-query.md](features/F15.2-settings-query.md) |
| 15.3 | Apply setting to all public price displays | [features/F15.3-apply-public.md](features/F15.3-apply-public.md) |

Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Acceptance Criteria

- Admin Settings page shows a "Display Settings" card with a `show_price` toggle (on by default).
- Toggling and saving updates `features.show_price` in `admin_settings` table via existing PATCH `/admin/api/settings`.
- Settings API PATCH response triggers `revalidateTag("site-settings")` to bust the public cache.
- A `getSiteSettings()` server function reads `show_price` from `admin_settings`, cached with `unstable_cache` (60 s, tag `site-settings`).
- `ProductCard` accepts a `showPrice?: boolean` prop (default `true`); price block is hidden when `false`.
- Homepage, product listing, and product detail pages fetch `getSiteSettings()` and forward `showPrice` to all price-rendering components.
- Quality gates: `tsc --noEmit` 0 errors | `eslint --max-warnings 0` clean | all existing tests pass + new tests pass.
