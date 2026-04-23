# Phase 6 — SEO & Performance

## Objective

Maximize discoverability and Core Web Vitals scores. Every public page must be indexable, have canonical URLs, hreflang alternates, JSON-LD structured data, and OG/Twitter cards. Target Lighthouse ≥ 90 for Performance, Accessibility, Best Practices, and SEO.

---

## Feature List

| ID | Feature | Priority | Complexity | Document |
|---|---|---|---|---|
| F6.1 | robots.txt & Dynamic Sitemap | P0 | Low | [features/F6.1-sitemap-robots.md](features/F6.1-sitemap-robots.md) |
| F6.2 | OG / Twitter Card Metadata | P0 | Medium | [features/F6.2-og-metadata.md](features/F6.2-og-metadata.md) |
| F6.3 | JSON-LD Structured Data | P0 | Medium | [features/F6.3-json-ld.md](features/F6.3-json-ld.md) |
| F6.4 | Core Web Vitals Optimization | P1 | High | [features/F6.4-cwv-optimization.md](features/F6.4-cwv-optimization.md) |

---

## Dependency Order

```
Phase 4 (all pages must exist)
 ├── F6.1 (sitemap needs all slugs)
 ├── F6.2 (OG metadata extends generateMetadata from Phase 4)
 ├── F6.3 (JSON-LD added to product detail pages)
 └── F6.4 (performance audit on existing pages)
```

**Implementation order:** F6.1 → F6.2 → F6.3 → F6.4

---

## Acceptance Criteria (Phase 6 Complete When)

- [ ] `/robots.txt` returns valid robots.txt content
- [ ] `/sitemap.xml` lists all active product and category pages in all 3 locales
- [ ] Every page has `<meta name="description">` and OG tags
- [ ] Product pages have JSON-LD `Product` type with offer price
- [ ] Homepage has JSON-LD `WebSite` type
- [ ] All `<link rel="alternate" hreflang="...">` tags present on every page
- [ ] Lighthouse score ≥ 90 on product detail page (mobile)
- [ ] No layout shift from images (width/height always set on next/image)
- [ ] Font subsetting in use (next/font with `subsets`)

---

## Test Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Snapshot tests | Vitest | sitemap XML shape, robots.txt content |
| Unit tests | Vitest | JSON-LD factory functions |
| Lighthouse CI | Lighthouse CLI | CWV thresholds on key pages |

---

## File Structure After Phase 6

```
src/app/
├── robots.ts            ← F6.1
└── sitemap.ts           ← F6.1

src/app/[locale]/
├── layout.tsx           ← F6.2 — root metadata + hreflang
├── page.tsx             ← F6.2/F6.3 — homepage generateMetadata + WebSite JSON-LD
├── products/
│   ├── page.tsx         ← F6.2 — listing generateMetadata
│   └── [slug]/
│       └── page.tsx     ← F6.2/F6.3 — detail generateMetadata + Product JSON-LD
└── categories/
    └── [slug]/
        └── page.tsx     ← F6.2 — category generateMetadata
```
