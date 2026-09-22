# Phase 11 — Rich Product Creation Form + Approval Workflow

**Status:** 🚧 In Progress
**Dependencies:** Phases 1–10 must be complete.
**Baseline:** 332 tests passing, 0 TypeScript errors, 0 ESLint warnings.

---

## Overview

Phase 11 gives admins two new capabilities:

1. **Compose full product pages inside the admin panel** with a TipTap-based rich text editor that outputs HTML.
2. **Gate product publication behind a workflow**: `draft → pending_review → approved → published`, with optional rejection back to `draft` and a reason stored alongside.

This replaces the implicit `is_active` toggle that Phase 8/9 used. `product_status` becomes the single source of truth; `is_active` is maintained only for backwards compatibility (published = `is_active=true`, all other statuses = `is_active=false`).

---

## Features

| # | Feature | Document |
|---|---|---|
| 11.1 | Product Status Workflow | [features/F11.1-product-status-workflow.md](features/F11.1-product-status-workflow.md) |
| 11.2 | Rich Text Editor (TipTap) | [features/F11.2-rich-text-editor.md](features/F11.2-rich-text-editor.md) |
| 11.3 | Product Creation Form | [features/F11.3-product-creation-form.md](features/F11.3-product-creation-form.md) |
| 11.4 | Product Editor Revamp | [features/F11.4.1-image-round-trip-and-dedup.md](features/F11.4.1-image-round-trip-and-dedup.md) · [2](features/F11.4.2-preview-with-signed-token.md) · [3](features/F11.4.3-grammar-and-spell-check.md) · [4](features/F11.4.4-ai-rewrite-and-translate.md) · [5](features/F11.4.5-seo-assistant.md) · [6](features/F11.4.6-wizard-and-autosave.md) ||| 11.5 | Orphan Upload Cleanup | [features/F11.5-orphan-upload-cleanup.md](features/F11.5-orphan-upload-cleanup.md) |
Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Section 11.4 — Product Editor Revamp (Drafted, Not Implemented)

**Status:** 📋 Documented, awaiting scope approval + gateway access before implementation. See `.puku/plans/phase_11_4_product_editor_77ff9c3e.plan.md` and `.review.md`.

**Motivation.** Admin users reported three pain points in the existing edit form:

1. "Removed image reappears on save" — root cause is the DELETE+POST N+1 loop in `src/app/admin/api/products/[id]/route.ts` (lines 47–56).
2. No way to preview the public page for drafts, rejected, or scheduled products.
3. No grammar / SEO guidance inside the editor.

**Sub-features (docs above):**

| ID | Sub-feature | Doc |
|---|---|---|
| 11.4.1 | Image round-trip fix + perceptual dedup (dHash + color histogram) | F11.4.1 |
| 11.4.2 | Public preview via signed-token HMAC (15-min, userId-bound, locale-aware) | F11.4.2 |
| 11.4.3 | Grammar & spell check via LanguageTool proxy + LLM fallback for bn-BD | F11.4.3 |
| 11.4.4 | AI rewrite / simplify / translate extending the existing AIAssistantModal | F11.4.4 |
| 11.4.5 | SEO assistant: deterministic scoring + AI rewrite, separate rate-limit bucket | F11.4.5 |
| 11.4.6 | Shared 5-step wizard + 10 s-idle autosave + conflict banner + Preview button | F11.4.6 |

**Acceptance for 11.4:**

- [ ] Removed image never reappears on save (regression test for the DELETE+POST loop).
- [ ] Same image pasted twice is detected as duplicate before the second row is added.
- [ ] `(product_id, phash)` UNIQUE constraint rejects duplicate rows at the database layer.
- [ ] Preview works for any `product_status` and any of the 3 locales, with a visible "Preview mode" banner.
- [ ] Preview URLs expire in 15 min and are rejected by the public route after expiry or tampering.
- [ ] Preview responses carry `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`; OG cards are not generated.
- [ ] "Check grammar" surfaces suggestions as editor decorations that the admin can apply per range.
- [ ] AI rewrite / simplify / translate preserve HTML structure (headings, lists, tables, wizard/comparison blocks).
- [ ] SEO panel shows a deterministic 0–100 score per locale and a "Suggest rewrite" AI action behind its own rate-limit bucket.
- [ ] Wizard steps persist in the URL (`?step=N`) and form values persist via `sessionStorage`.
- [ ] Autosave fires only after 10 s idle with a hard cap of 1 save / 10 s.
- [ ] Conflict detected when server `updated_at` moves underneath the client; banner offers Reload or Keep mine.
- [ ] All new copy is shipped in `messages/en.json`, `messages/bn-BD.json`, `messages/sv.json` (parity enforced by `node scripts/check-locale-parity.mjs`).
- [ ] Feature flag `NEXT_PUBLIC_PRODUCT_EDITOR_V2` (default `false` for one release) gates the wizard; legacy tabs remain usable.

**Gateways / external dependencies introduced:**

| Env var | Purpose | Where used |
|---|---|---|
| `MYSQL_PREVIEW_SECRET` | HMAC key for signed preview tokens | F11.4.2 |
| `LANGUAGETOOL_API_URL` | Grammar proxy (default `https://api.languagetool.org/v2`) | F11.4.3 |
| `NEXT_PUBLIC_PRODUCT_EDITOR_V2` | Wizard toggle | F11.4.6 |
| `FEATURE_GRAMMAR` | Toolbar button toggle | F11.4.3 |
| `FEATURE_LLM_GRAMMAR` | LLM fallback for grammar | F11.4.3 |
| `FEATURE_AI_REWRITE` | Modal rewrite/simplify/translate | F11.4.4 |
| `FEATURE_SEO_ASSISTANT` | SEO panel toggle | F11.4.5 |
| `FEATURE_AUTOSAVE` | Autosave hook toggle | F11.4.6 |
| `FEATURE_PREVIEW_BUTTON` | Preview button toggle | F11.4.2 |
| `FEATURE_PREVIEW_TOKEN` | Middleware bypass toggle | F11.4.2 ||| `FEATURE_REMOVE_ORPHAN_UPLOADS` | Unlink orphan files on product save | F11.5 |
**Gateway-side change required before client code lands:** A new idempotent `PUT /api/products/:id/images` on the MySQL API Gateway, plus migration `00010_product_image_dedup.sql`. Until the gateway change ships, the DELETE+POST loop persists and F11.4.1 cannot be marked complete.

**Test matrix (new rows):** rows 1–15 in `tests/TEST_MATRIX.md`.

**Rollback strategy:** All features are env-gated. Disabling every `FEATURE_*` flag returns behavior to pre-11.4. The feature flag `NEXT_PUBLIC_PRODUCT_EDITOR_V2=false` keeps the legacy tab UI live for one release cycle.

---

## Section 11.5 — Orphan Upload Cleanup (Implemented)

**Status:** ✅ Shipped June 2026. See [features/F11.5-orphan-upload-cleanup.md](features/F11.5-orphan-upload-cleanup.md).

**Motivation.** Removing an image from a product in the editor used to delete only the `product_images` row; the physical file under `public/uploads/products/...` was left as an orphan. After many edits, this builds up silently and is invisible to admins.

**Approach.** Pure helper `removeOrphanUploads({ previous, next })` diffs URL lists and unlinks dropped local files. Called from the PATCH route after the gateway write succeeds. External URLs (Amazon CDN), path-traversal attempts, and ENOENT are all no-ops. Files that may be shared across products are preserved unless an `isUrlStillReferenced` oracle proves otherwise. Errors are logged but never bubble — the save has already succeeded.

**Acceptance for 11.5:**

- [x] `src/lib/uploads/remove-orphan-uploads.ts` exports `removeOrphanUploads`, `isRemoveOrphanUploadsEnabled`, `resolveSafeUploadPath`.
- [x] PATCH route captures previous image URLs from `GET /api/products/:id` BEFORE the gateway write.
- [x] After the existing DELETE+POST loop, if `FEATURE_REMOVE_ORPHAN_UPLOADS=true`, the helper is called and the outcome is logged via `console.info("[product-images] orphan cleanup", ...)`.
- [x] Helper rejects URLs that resolve outside `public/uploads/`, contain null bytes, or contain `%2e%2e` segments.
- [x] External URLs (`https://...`) are placed in `externalIgnored[]` and never touched.
- [x] ENOENT is treated as success; file already gone is not an error.
- [x] When `isUrlStillReferenced` is not provided, shared-looking URLs are placed in `preservedShared[]` (conservative default).
- [x] `vitest run src/lib/uploads/__tests__/remove-orphan-uploads.test.ts` → 16/16 passing.
- [x] `npx tsc --noEmit` → 0 errors in changed files (3 unrelated pre-existing errors in `.next/types/**`).
- [x] `npx eslint src/lib/uploads src/app/admin/api/products/[id]/route.ts --max-warnings 0` → 0 warnings, 0 errors.
- [x] Full Vitest suite shows no regression: 552 pass, 11 fail — same 11 fail on the pristine tree (verified via `git stash` round-trip), confirming these are pre-existing issues in `schemas.test.ts`, `messages.test.ts`, `RichTextEditor.test.tsx`.

**Gateway / external dependency:** None. The helper is filesystem-only. A future enhancement may add a gateway endpoint to support the `isUrlStillReferenced` oracle for cross-product safety.

**Test matrix (new rows):** rows 39–54 in `tests/TEST_MATRIX.md`.

**Rollback strategy:** Set `FEATURE_REMOVE_ORPHAN_UPLOADS=false` (or unset). The PATCH handler returns to its previous behavior — files are never unlinked, rows are still replaced. The helper itself remains compiled but is dormant.

**Observability:** Structured log line `[product-images] orphan cleanup` carries the full `RemoveOrphanOutcome` for every save that triggered any work. Watch for `unlinked.length > 10` per save (mass deletion) and any non-empty `failed[]` array.

**Observability:** Structured logs `{ event: "product.autosave", productId, durationMs, byteSize, userId }`, `{ event: "product.preview_token.issued", productId, userId, locale }`, `{ event: "product.grammar.checked", userId, suggestionCount }`. Soft-throttle anomalies: > 20 autosaves / min / user, > 100 grammar calls / min.

---

## Acceptance Criteria

### Feature 11.1 — Product Status Workflow
- [ ] Migration `00009_product_workflow.sql` adds `product_status` enum (`draft | pending_review | approved | published`, default `draft`), `rejection_reason TEXT NULL`, `submitted_by TEXT NULL`, and a partial index on `product_status`.
- [ ] Existing rows are backfilled: where `is_active=true` → `published`, else → `draft`.
- [ ] Domain `Product` type exposes `product_status`, `rejection_reason`, `submitted_by`.
- [ ] Zod `productUpdateSchema` accepts `product_status` as an optional enum value.
- [ ] POST `/admin/api/products/[id]/approve` sets `product_status='approved'` (requires admin).
- [ ] POST `/admin/api/products/[id]/reject` sets `product_status='draft'`, stores `rejection_reason` (Zod-validated, required, min 5 chars).
- [ ] POST `/admin/api/products/[id]/publish` sets `product_status='published'`, `is_active=true`, clears `publish_at`.
- [ ] `getScheduledProducts()` (Phase 9 dashboard query) only returns rows with `product_status='approved'`.
- [ ] Review queue page `src/app/admin/products/review/page.tsx` lists pending products with Approve / Reject actions.
- [ ] AdminShell sidebar shows "Review Queue" link with a numeric badge for pending count.

### Feature 11.2 — Rich Text Editor
- [ ] TipTap core + extensions installed via `npm install`.
- [ ] `src/app/admin/_components/ui/RichTextEditor.tsx` is a client component exposing `value: string`, `onChange(html: string)`, `placeholder?: string`.
- [ ] Toolbar buttons: Bold, Italic, Underline, Strikethrough, H1, H2, H3, bullet list, ordered list, insert table, insert link, insert image URL, text align (left/center/right), color, highlight, undo, redo.
- [ ] Editor content is stored as HTML string in `products.description[locale]`.
- [ ] Wherever rendered from a server component, the editor is imported via `next/dynamic` with `ssr: false`.

### Feature 11.3 — Product Creation Form
- [ ] `/admin/products/new` renders a `ProductCreateForm` with tabs for General, Locales (en / bn-BD / sv), Features, Pricing, Images, SEO.
- [ ] Per-locale tabs carry title, slug, description (RichTextEditor), meta_title, meta_description.
- [ ] Slug auto-generates from title when field is empty (existing `slugify` helper).
- [ ] "Sync from Amazon" section (top of form) accepts an ASIN, calls `/admin/api/products/import`, and autofills all fields from the returned draft row.
- [ ] Two submit buttons: "Save as Draft" (`product_status='draft'`) and "Submit for Review" (`product_status='pending_review'`).
- [ ] After successful save, redirect to `/admin/products/[id]`.
- [ ] "New Product" button on `/admin/products` links to `/admin/products/new`.

---

## Quality Gates

- `npx tsc --noEmit` — 0 errors.
- `npx eslint . --max-warnings 0` — 0 warnings.
- `npx vitest run` — all prior tests plus the new ones pass.

---

## File Structure

```
supabase/
└── migrations/
    └── 00009_product_workflow.sql                  ← new

src/
├── app/
│   └── admin/
│       ├── _components/
│       │   ├── AdminShell.tsx                      ← updated (Review Queue link)
│       │   └── ui/RichTextEditor.tsx               ← new
│       ├── _lib/
│       │   └── schemas/product.ts                  ← updated (product_status)
│       ├── api/
│       │   └── products/
│       │       ├── [id]/approve/route.ts           ← new
│       │       ├── [id]/reject/route.ts            ← new
│       │       └── [id]/publish/route.ts           ← new
│       └── products/
│           ├── page.tsx                            ← updated (New Product btn)
│           ├── new/
│           │   ├── page.tsx                        ← new
│           │   └── _components/
│           │       └── ProductCreateForm.tsx       ← new
│           └── review/
│               ├── page.tsx                        ← new
│               └── _components/ReviewQueueTable.tsx ← new
└── types/domain.ts                                 ← updated (product_status)
```

---

## Migration Notes

`00009_product_workflow.sql` must be idempotent:

```sql
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft','pending_review','approved','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_status product_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by TEXT;

UPDATE products
SET product_status = CASE WHEN is_active THEN 'published'::product_status
                          ELSE 'draft'::product_status END
WHERE product_status IS DISTINCT FROM CASE WHEN is_active THEN 'published'::product_status ELSE 'draft'::product_status END;

CREATE INDEX IF NOT EXISTS idx_products_product_status
  ON products (product_status)
  WHERE product_status IN ('pending_review','approved');
```
