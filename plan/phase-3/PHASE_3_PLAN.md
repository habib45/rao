# Phase 3 — Amazon PA-API 5.0 Integration

## Objective

Build the back-end bridge between Amazon's Product Advertising API 5.0 and the Supabase database. All PA-API credentials live exclusively in Supabase Vault / Edge Function environment variables — they never touch the Next.js application bundle.

---

## Feature List

| ID | Feature | Priority | Complexity | Document |
|---|---|---|---|---|
| F3.1 | AWS SigV4 Signing & PA-API Client | P0 | High | [features/F3.1-sigv4-client.md](features/F3.1-sigv4-client.md) |
| F3.2 | sync-amazon-products Edge Function | P0 | High | [features/F3.2-sync-products.md](features/F3.2-sync-products.md) |
| F3.3 | update-prices Edge Function | P0 | Medium | [features/F3.3-update-prices.md](features/F3.3-update-prices.md) |
| F3.4 | track-click Edge Function | P0 | Low | [features/F3.4-track-click.md](features/F3.4-track-click.md) |
| F3.5 | search-products Edge Function | P1 | Medium | [features/F3.5-search-products.md](features/F3.5-search-products.md) |

---

## Dependency Order

```
F3.1 (SigV4 + PA-API client — shared module)
 ├── F3.2 (sync-amazon-products)   ← uses client
 ├── F3.3 (update-prices)          ← uses client
 └── F3.5 (search-products)        ← uses client
F3.4 (track-click)                 ← no PA-API; pure DB insert
```

**Implementation order:** F3.1 → F3.4 → F3.2 → F3.3 → F3.5

---

## Acceptance Criteria (Phase 3 Complete When)

- [ ] `supabase functions serve` runs all 4 functions without errors
- [ ] SigV4 request signing produces a valid `Authorization` header (verified against test vector)
- [ ] `sync-amazon-products` upserts product rows and images into the database
- [ ] `update-prices` updates `price_cents` and inserts a `price_history` row for changed prices
- [ ] `track-click` inserts a `click_tracking` row with ip_hash deduplication
- [ ] `search-products` returns product rows filtered by a tsvector query
- [ ] All functions handle 429 (rate-limit) with exponential backoff
- [ ] No PA-API secrets are referenced from Next.js source files
- [ ] `npx tsc --noEmit` on `src/lib/amazon/` passes with zero errors

---

## Test Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | SigV4 signing, response transformers, utils |
| Integration (mocked PA-API) | Vitest + fetch mock | sync handler logic, rate-limit retry |
| Edge Function smoke tests | Supabase CLI | Deployed function health checks |

Test files live in `src/lib/amazon/__tests__/` and `supabase/functions/**/__tests__/`.

---

## New Environment Variables

```
# Server-only (Supabase Edge Function secrets)
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_PARTNER_TAG=
AMAZON_HOST=webservices.amazon.com
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## File Structure After Phase 3

```
src/lib/amazon/
├── sigv4.ts           ← F3.1 — AWS SigV4 request signer
├── client.ts          ← F3.1 — PA-API HTTP client (fetch wrapper)
├── config.ts          ← F3.1 — endpoint/resource config constants
├── types.ts           ← F3.1 — PA-API request/response TS types
├── transformers.ts    ← F3.1 — PA-API → domain type mappers
├── utils.ts           ← F3.1 — ip hashing, dedup helpers
├── handlers.ts        ← F3.2/F3.3 — shared sync/price logic
└── __tests__/
    ├── sigv4.test.ts
    ├── transformers.test.ts
    └── utils.test.ts

supabase/functions/
├── _shared/
│   ├── cors.ts        ← CORS headers helper
│   └── supabase.ts    ← service role client factory
├── sync-amazon-products/
│   └── index.ts       ← F3.2
├── update-prices/
│   └── index.ts       ← F3.3
├── track-click/
│   └── index.ts       ← F3.4
└── search-products/
    └── index.ts       ← F3.5
```
