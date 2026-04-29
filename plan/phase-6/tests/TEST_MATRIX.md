# Phase 6 — Test Matrix

## Unit Tests

### `src/app/__tests__/sitemap.test.ts`

| Test ID | Description | Expected |
|---|---|---|
| T6.1.1 | Sitemap includes homepage for all 3 locales | 3 entries with `/en`, `/bn-BD`, `/sv` |
| T6.1.2 | Sitemap includes all active product slugs | Count matches DB stub |
| T6.1.3 | Sitemap entries have `lastModified` date | Valid Date object |
| T6.1.4 | Sitemap entries have `priority` field | Product: 0.8 |
| T6.1.5 | robots.ts returns valid robots object | Contains `sitemap` field |

### `src/app/__tests__/json-ld.test.ts` (if JSON-LD is a helper function)

| Test ID | Description | Expected |
|---|---|---|
| T6.2.1 | `buildProductJsonLd` formats price as decimal | `"price": "29.99"` |
| T6.2.2 | `buildProductJsonLd` omits rating when null | No `aggregateRating` key |
| T6.2.3 | `buildProductJsonLd` maps availability to schema.org URL | `"https://schema.org/InStock"` |
| T6.2.4 | `buildWebSiteJsonLd` includes SearchAction | `potentialAction` present |

## Metadata Tests

### `src/app/[locale]/products/[slug]/__tests__/page.test.ts`

| Test ID | Description | Expected |
|---|---|---|
| T6.3.1 | `generateMetadata` returns og:title | Contains product name |
| T6.3.2 | `generateMetadata` truncates description to 155 chars | Length ≤ 155 |
| T6.3.3 | `generateMetadata` includes hreflang for all 3 locales | 3 `languages` keys |
| T6.3.4 | `generateMetadata` returns fallback for missing product | No error thrown |
