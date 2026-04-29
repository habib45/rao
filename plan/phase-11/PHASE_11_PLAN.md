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

Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

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
