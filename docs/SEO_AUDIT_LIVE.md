# Live SEO Audit — RaoFinds (localhost:3000)

**Audit date:** 2026-07-12
**Method:** 25-point automated auditor (`/tmp/seo-audit/audit.mjs`) running against fetched HTML for each page.
**Verifier:** vitest SEO test suite — **36 / 36 passing** (`seo-structure.test.tsx` 18 + `layout.test.tsx` 18).

---

## 1. Overall Site Score

| Page | URL | Passed | Total | Score |
|---|---|---:|---:|---:|
| Home | `/en` | 25 | 26 | **96 %** |
| Categories | `/en/categories` | 23 | 26 | **88 %** |
| Blog post | `/en/blog/ultimate-guide-to-instant-pot-sweet-and-sour-chicken-2026-expert-review` | 20 | 26 | **77 %** |
| Products index | `/en/products` | 19 | 26 | **73 %** |
| **Site-wide** | — | **87** | **104** | **84 %** |

The 4 audited pages give a representative cross-section of the site. Site-wide score is the simple mean of per-page percentages.

---

## 2. Per-page Breakdown

### 2.1 Home `/en` — 96 % (Excellent)

✅ Pass: 25 / 26. Only one failure:

- ✗ `robots meta present` missing — page does not emit an explicit `<meta name="robots">` tag.

Everything else is green: title (34 chars), description (139 chars), canonical, 4 hreflang codes incl. `x-default`, full OpenGraph (`title`, `description`, `image`, `url`, `locale=en_US`, `site_name=RaoFinds`), full Twitter card, 2 JSON-LD blocks, `html[lang]`, viewport, charset, single `<h1>`, all 9 sampled images have `alt`, favicon.

### 2.2 Categories `/en/categories` — 88 % (Good)

✅ Pass: 23 / 26. Failed:

- ✗ Title length = 25 chars (target 30–65) — too short.
- ✗ Description length = 82 chars (target 120–160) — too short.
- ✗ `robots meta present` missing.

All OpenGraph + Twitter fields are present (full set), hreflang complete, JSON-LD present, single `<h1>`, viewport OK.

### 2.3 Blog post `/en/blog/ultimate-guide-...` — 77 % (Acceptable)

✅ Pass: 20 / 26. Failed:

- ✗ Title length = **86 chars** (target 30–65) — too long; will be truncated in SERP.
- ✗ Description length = **343 chars** (target 120–160) — far too long.
- ✗ `x-default hreflang` missing — only `en`, `bn-BD`, `sv`, no `x-default`.
- ✗ `og:locale` missing.
- ✗ `og:site_name` missing.
- ✗ `robots meta present` missing.

Source: `src/app/[locale]/blog/[slug]/page.tsx` — has hand-rolled `generateMetadata` that does NOT route through `buildArticleMetadata`.

### 2.4 Products index `/en/products` — 73 % (Needs work)

✅ Pass: 19 / 26. Failed:

- ✗ Title length = 23 chars (target 30–65).
- ✗ Description length = 107 chars (target 120–160).
- ✗ `og:image` missing.
- ✗ `og:locale` missing.
- ✗ `og:site_name` missing.
- ✗ `twitter:image` missing.
- ✗ `robots meta present` missing.

Source: `src/app/[locale]/products/page.tsx` — hand-rolled `generateMetadata`, not using `buildPageMetadata`.

---

## 3. Cross-page Pattern: Robots Meta

Every audited page is missing `<meta name="robots">`. This is consistent across the site. Easy fix: add `robots: { index: true, follow: true }` to the root layout metadata in `src/app/[locale]/layout.tsx`, or have `buildPageMetadata` default it.

---

## 4. robots.txt Audit (PASS)

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /cart
Disallow: /static/

User-Agent: Googlebot
User-Agent: Bingbot
(with Crawl-delay: 1)

Sitemap: http://localhost:3000/sitemap.xml
```

✅ Per-bot rules, sensible disallow paths, sitemap declared.

---

## 5. sitemap.xml Audit (PASS)

- 34 `<loc>` URLs.
- 136 `xhtml:link` alternate hreflang annotations (≈ 4 per URL = en, bn-BD, sv, x-default).
- All 34 URLs include `hreflang="x-default"` — correct.
- `<lastmod>`, `<changefreq>`, `<priority>` present per entry.
- Proper `xmlns:xhtml` namespace declared.

✅ Multi-locale sitemap with full hreflang cluster — best-practice for international SEO.

---

## 6. Prioritized Fix List

| Priority | Issue | Pages | Effort | Fix |
|---|---|---|---|---|
| 🔴 P0 | Add `meta robots` to root layout | All | 1 line | Add `robots: { index: true, follow: true }` in `src/app/[locale]/layout.tsx` metadata |
| 🔴 P1 | Blog `[slug]` use `buildArticleMetadata` | Blog | refactor | Replace hand-rolled `generateMetadata` in `src/app/[locale]/blog/[slug]/page.tsx` with `buildArticleMetadata(...)` — fixes title length, desc length, x-default, og:locale, og:site_name |
| 🟠 P2 | Products index use `buildPageMetadata` | Products | refactor | Replace hand-rolled metadata in `src/app/[locale]/products/page.tsx` |
| 🟠 P3 | Categories title/description too short | Categories | copy | Extend title to 30+ chars, description to 120–160 |
| 🟡 P4 | Products index title/description too short | Products | copy | Same as above after refactor |
| 🟢 P5 | Blog index should also use `buildPageMetadata` | Blog index | refactor | Replace hand-rolled OG in `src/app/[locale]/blog/page.tsx` |

After fixes, expected site-wide score: **95–100 %**.

---

## 7. Test Suite Status

```
$ npx vitest run src/__tests__/seo-structure.test.tsx \
                  src/app/[locale]/__tests__/layout.test.tsx

 ✓ src/__tests__/seo-structure.test.tsx              (18 tests)
 ✓ src/app/[locale]/__tests__/layout.test.tsx        (18 tests)

Test Files  2 passed (2)
     Tests  36 passed (36)
```

All SEO unit/integration tests green. The live audit covers runtime HTML output that the test suite mocks — both layers agree the SEO foundation is sound.