# Phase 3 — Test Matrix

## Unit Tests

### `src/lib/amazon/__tests__/sigv4.test.ts`

| Test ID | Description | Expected |
|---|---|---|
| T3.1.1 | Known test vector: signing key derivation | Matches AWS test vector |
| T3.1.2 | Authorization header format | Starts with `AWS4-HMAC-SHA256` |
| T3.1.3 | x-amz-date header is UTC format | Matches `/^\d{8}T\d{6}Z$/` |
| T3.1.4 | Canonical request includes content hash | Header present and non-empty |
| T3.1.5 | Different credentials produce different signatures | Signatures not equal |

### `src/lib/amazon/__tests__/transformers.test.ts`

| Test ID | Description | Expected |
|---|---|---|
| T3.2.1 | `transformItem` maps ASIN correctly | `product.asin === "B001ABCDE"` |
| T3.2.2 | `transformItem` converts price to cents | `price_cents === 2999` for $29.99 |
| T3.2.3 | `transformItem` returns null price when missing | `price_cents === null` |
| T3.2.4 | `transformItem` maps availability correctly | `"in_stock"` / `"out_of_stock"` / `"unknown"` |
| T3.2.5 | `transformImage` sets is_primary=true for sort_order=0 | Correct |
| T3.2.6 | `transformImage` sets is_primary=false for sort_order>0 | Correct |
| T3.2.7 | `transformItem` maps name to TranslationMap.en | Correct |

### `src/lib/amazon/__tests__/utils.test.ts`

| Test ID | Description | Expected |
|---|---|---|
| T3.3.1 | `hashIp("127.0.0.1", "Mozilla")` is deterministic | Same hash on repeat calls |
| T3.3.2 | Different ip+ua produces different hash | Hashes not equal |
| T3.3.3 | `chunkArray([1..25], 10)` → 3 chunks | lengths [10, 10, 5] |
| T3.3.4 | `buildAffiliateUrl(asin, tag)` contains asin and tag | URL contains both |

## Integration Tests (Mocked fetch)

| Test ID | Description | Expected |
|---|---|---|
| T3.4.1 | `getItems` with 200 response returns items array | Correct length |
| T3.4.2 | `getItems` retries once on 429 then succeeds | fetch called twice |
| T3.4.3 | `getItems` gives up after 5 retries on 429 | Throws error |
| T3.4.4 | `getItems` throws on 500 without retry | fetch called once |
