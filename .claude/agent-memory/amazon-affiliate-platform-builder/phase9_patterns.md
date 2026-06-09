---
name: Phase 9 Implementation Patterns — Import + Scheduling
description: Non-obvious patterns discovered while adding ASIN import and scheduled publishing to the admin panel
type: project
---

Phase 9 (April 2026) added the `import-product` and `publish-scheduled` API Gateway endpoints, `publish_at` column on `products`, and dashboard widgets for both features.

**Why:** Operators needed (1) a one-click way to ingest a single ASIN into the catalogue as a draft and (2) the ability to pre-stage drafts to go live at a scheduled time.

**How to apply:** When extending these flows:
- API Gateway `fetch<T>()` supports a generic return type — use it to type the expected API payload. Avoid unsafe casting.
- The thenable API Gateway stub pattern (see `categories.test.ts`) does not work cleanly for routes that call API endpoints AND database operations in the same request. Build a per-table dispatcher (see `import.test.ts`) instead of the thenable chain.
- `z.string().datetime({ offset: true })` accepts ISO 8601 with `Z` or explicit offset; it rejects values like `"not-a-date"`.
- `<input type="datetime-local">` value is in the browser's local timezone — always serialise via `new Date(value).toISOString()` before PATCH to get canonical UTC.
- `publish_scheduled_products()` is `SECURITY DEFINER` and filters `is_active = FALSE` to stay idempotent if an operator manually activates a product before the cron fires.
- Dashboard ScheduledPublishWidget is a server component that accepts `products` as a prop — this lets it be rendered synchronously in Vitest without async boundary wrappers.
