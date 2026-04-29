# Phase 13 — Media Manager (Supabase Storage)

**Status:** 📋 Planned
**Dependencies:** Phases 1–12 must be complete.

---

## Overview

Phase 13 adds a built-in media manager so admins can upload, organise, and reuse images without leaving the admin panel. Media lives in a Supabase Storage public bucket (`media`), is read via the bucket's public URL (`<supabase-url>/storage/v1/object/public/media/…`), and written / deleted only via admin API routes (service-role) that enforce `requireAdmin()`.

The media manager is also embedded as a picker modal inside the product create/edit forms to replace plain URL inputs.

---

## Features

| # | Feature | Document |
|---|---|---|
| 13.1 | Storage Setup & RLS | [features/F13.1-storage-setup.md](features/F13.1-storage-setup.md) |
| 13.2 | Admin Media Manager UI | [features/F13.2-admin-media-ui.md](features/F13.2-admin-media-ui.md) |
| 13.3 | Media API Routes | [features/F13.3-media-api-routes.md](features/F13.3-media-api-routes.md) |
| 13.4 | Product Form Integration | [features/F13.4-product-form-integration.md](features/F13.4-product-form-integration.md) |

Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Acceptance Criteria

- [ ] Public bucket `media` exists; images can be read at `/storage/v1/object/public/media/<path>`.
- [ ] Admin can create folders (virtual, via a zero-byte `.keep` placeholder object).
- [ ] Admin can upload single or multiple images via drag-and-drop or file picker.
- [ ] Admin can delete files and folders (with confirmation).
- [ ] Admin can copy the public URL of any file to the clipboard.
- [ ] File grid filters to image types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`).
- [ ] `ProductCreateForm` and `ProductEditForm` gain a "Browse Media" button next to each image URL input that opens the media picker.
- [ ] AdminShell sidebar shows "Media" link.

---

## File Structure

```
src/
└── app/
    └── admin/
        ├── _components/
        │   ├── AdminShell.tsx                       ← updated (Media link)
        │   └── media/
        │       ├── FolderTree.tsx                   ← new
        │       ├── FileGrid.tsx                     ← new
        │       ├── UploadDropzone.tsx               ← new
        │       ├── CreateFolderDialog.tsx           ← new
        │       └── MediaPickerDialog.tsx            ← new (embeddable)
        ├── api/
        │   └── media/
        │       ├── route.ts                         ← new (GET list, POST create folder)
        │       ├── upload/route.ts                  ← new (POST multipart upload)
        │       └── [...path]/route.ts               ← new (DELETE)
        └── media/
            └── page.tsx                             ← new (server shell)
```

---

## Quality Gates
- `npx tsc --noEmit` — 0 errors.
- `npx eslint . --max-warnings 0` — 0 warnings.
- `npx vitest run` — all prior tests plus new cases pass.
