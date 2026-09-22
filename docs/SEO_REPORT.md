# International SEO Report

Phase 22 — International SEO standards implementation.

## Summary

Centralized SEO configuration and metadata helpers for the RaoFinds Next.js
app, aligned with Google's [international SEO documentation][goog-intl] and
the [OpenGraph protocol][ogp].

The build emits:

- A **per-locale canonical URL** for every public route (en, bn-BD, sv).
- **hreflang** `link rel="alternate"` annotations, including the
  `x-default` fallback that points at the English variant.
- **OpenGraph locale** (`og:locale`) and **alternateLocale** list, derived
  from the page's locale and never including the page's own locale as a
  self-referential alternate.
- **Schema.org JSON-LD** (`Organization`, `WebSite` with `SearchAction`,
  `BreadcrumbList`) emitted via a single shared `<JsonLd />` server
  component that escapes `</script>` sequences.
- **Per-bot `robots.txt`** rules for Googlebot, Googlebot-Image,
  Googlebot-News, Bingbot, Slurp, DuckDuckBot, Baiduspider, YandexBot, and
  Applebot, with a `Host:` directive.
- **Sitemap** (`sitemap.xml`) with `<xhtml:link rel="alternate" hreflang>`
  entries for every supported locale and `x-default`.
- **Webmaster verification meta tags** (Google, Bing, Yandex, Apple,
  Microsoft, Baidu, Pinterest, Facebook Domain, Norton DC) rendered only
  when the corresponding `NEXT_PUBLIC_*_VERIFICATION` env var is set.
- **Apple iTunes smart-app-banner meta** rendered only when
  `NEXT_PUBLIC_APPLE_ITUNES_APP_ID` is set.

[goog-intl]: https://developers.google.com/search/docs/specialty/international
[ogp]: https://ogp.me/

## File map

| File | Purpose |
| --- | --- |
| `src/lib/seo-config.ts` | Single source of truth for site URL, social profiles, verification codes, Apple iTunes config, robots host, and supported locales. Reads `NEXT_PUBLIC_*` env vars with sensible defaults. |
| `src/lib/seo.ts` | Metadata helpers (`buildPageMetadata`, `buildArticleMetadata`, `buildProductMetadata`, `buildAlternates`, `absoluteUrl`, `normalizeImage`, `buildCanonical`). |
| `src/components/JsonLd.tsx` | Shared `<JsonLd />` server component plus `organizationJsonLd()`, `websiteJsonLd(locale)`, `breadcrumbJsonLd(items)`, `appleItunesAppMeta()` helpers. |
| `src/app/[locale]/layout.tsx` | Per-locale metadata + inline `Organization` and `WebSite` JSON-LD + verification meta loop + apple-itunes-app meta. |
| `src/app/[locale]/page.tsx` | Homepage metadata routed through `buildPageMetadata`. |
| `src/app/[locale]/categories/page.tsx` | Categories index metadata routed through `buildPageMetadata`. |
| `src/app/sitemap.ts` | Sitemap with hreflang + image entries (already present from Phase 6, unchanged in this phase). |
| `src/app/robots.ts` | Per-bot `robots.txt` with `Host` directive (already present from Phase 6, unchanged in this phase). |

## Configuration knobs

All configuration is env-driven with safe defaults. Set the following in
the deployment environment to enable each feature.

| Env var | Default | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://raofinds.com` | `metadataBase`, `og:url`, canonical, JSON-LD `url`. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | _empty_ | `<meta name="google-site-verification">`. |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | _empty_ | `<meta name="msvalidate.01">` (Bing). |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` | _empty_ | `<meta name="yandex-verification">`. |
| `NEXT_PUBLIC_APPLE_VERIFICATION` | _empty_ | Apple Search Ads verification meta. |
| `NEXT_PUBLIC_MSCLT_SITE_VERIFICATION` | _empty_ | `<meta name="msvalidate.01">` (Microsoft). |
| `NEXT_PUBLIC_BAIDU_SITE_VERIFICATION` | _empty_ | `<meta name="baidu-site-verification">`. |
| `NEXT_PUBLIC_PINTEREST_VERIFICATION` | _empty_ | `<meta name="p:domain_verify">`. |
| `NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION` | _empty_ | `<meta name="facebook-domain-verification">`. |
| `NEXT_PUBLIC_NORTON_DC_TOKEN` | _empty_ | Norton DC token meta. |
| `NEXT_PUBLIC_APPLE_ITUNES_APP_ID` | _empty_ | `<meta name="apple-itunes-app">` (smart-app-banner). |
| `NEXT_PUBLIC_APPLE_ITUNES_AFFILIATE_DATA` | _empty_ | Apple affiliate-data segment of the iTunes meta. |
| `NEXT_PUBLIC_APPLE_ITUNES_APP_ARGUMENT` | _empty_ | Apple app-argument segment of the iTunes meta. |
| `NEXT_PUBLIC_ROBOTS_HOST` | `NEXT_PUBLIC_SITE_URL` | `Host:` directive in `robots.txt`. |

## Verification

- `npx tsc --noEmit` — 0 new errors in touched files. (3 pre-existing
  errors in `.next/types/app/admin/api/.../route.ts` remain.)
- `npx eslint` on touched files — clean.
- `npx vitest run src/__tests__/seo-structure.test.tsx` — 18 / 18 passing.
- `npx vitest run src/app/[locale]/__tests__/layout.test.tsx` — 18 / 18
  passing. (One pre-existing assertion updated to match the new
  `metadataBase` always-defined contract.)

## Pre-existing test failures (out of scope)

The following tests fail on the baseline branch (without these changes
applied). They are **not** regressions introduced by this phase:

- `src/app/admin/_components/__tests__/RichTextEditor.test.tsx` — CKEditor
  module mock issue.
- `src/app/admin/_lib/__tests__/schemas.test.ts` —
  `productUpdateSchema` and `sitemapCustomEntrySchema` zod schema tests.
- `src/messages/__tests__/messages.test.ts` — bn-BD and sv translation
  key completeness checks.

These should be triaged in a separate phase.

## Manual smoke test (post-deploy)

1. `curl -sSL https://raofinds.com/en | grep -E '<link rel="canonical"|hreflang'` — must show
   - `<link rel="canonical" href="https://raofinds.com/en">`
   - `<link rel="alternate" hreflang="en" href="https://raofinds.com/en">`
   - `<link rel="alternate" hreflang="bn-BD" href="https://raofinds.com/bn-BD">`
   - `<link rel="alternate" hreflang="sv" href="https://raofinds.com/sv">`
   - `<link rel="alternate" hreflang="x-default" href="https://raofinds.com/en">`
2. `curl -sSL https://raofinds.com/robots.txt` — must include per-bot
   rules and a `Host:` directive.
3. `curl -sSL https://raofinds.com/sitemap.xml | head -50` — must include
   `<xhtml:link rel="alternate" hreflang="...">` entries on every URL.
4. Validate JSON-LD blocks with Google's
   [Rich Results Test][rich-results] on a product page and on the
   homepage.

[rich-results]: https://search.google.com/test/rich-results