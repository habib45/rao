# Phase 21 — Public Folder Media Manager

**Status:** 🚧 In Progress  
**Dependencies:** Phase 8 (admin auth, AdminShell)

---

## Overview

Phase 21 adds a second media manager — one that stores images directly in the Next.js `public/uploads/` directory and serves them at `/uploads/<filename>` via Next.js's built-in static file server. No external service (Supabase Storage) is required.

This complements the existing Supabase Storage media manager (Phase 13). Use this one for:
- Static site assets (logos, banners, decorative images)
- Files that must have a stable, clean URL (`/uploads/hero.webp`)
- Local-first development workflows
- VPS/Docker deployments without Supabase Storage configured

> **Important:** Writes to `public/uploads/` persist on VPS/Docker/local deployments. On Vercel (serverless), the write lands in the ephemeral layer and vanishes after the invocation. Use Supabase Storage (Phase 13) for serverless production uploads.

---

## Features

| # | Feature | Document |
|---|---|---|
| 21.1 | File System API Routes | [features/F21.1-filesystem-api-routes.md](features/F21.1-filesystem-api-routes.md) |
| 21.2 | Admin Public Media UI | [features/F21.2-admin-public-media-ui.md](features/F21.2-admin-public-media-ui.md) |

Test matrix: [tests/TEST_MATRIX.md](tests/TEST_MATRIX.md)

---

## Acceptance Criteria

- [ ] `public/uploads/` directory is created automatically on first upload if it does not exist.
- [ ] Admin can upload single or multiple image files via the file picker (accepts `image/*`).
- [ ] Admin can create sub-folders inside `public/uploads/` via a folder-name modal.
- [ ] Admin can navigate into sub-folders and back to root.
- [ ] Admin can copy the public URL (`/uploads/<path>`) of any file to the clipboard.
- [ ] Admin can delete individual files (with confirmation).
- [ ] File grid filters to image types (jpg, jpeg, png, webp, gif, svg).
- [ ] AdminShell sidebar shows a "Public Media" link.
- [ ] All API routes enforce `requireAdmin()`.
- [ ] Path traversal (`..`) is rejected at the API layer.
- [ ] File size limit: 10 MB per file, enforced server-side (413 response).

---

## File Structure

```
src/
└── app/
    └── admin/
        ├── _components/
        │   └── AdminShell.tsx          ← updated (Public Media link)
        ├── api/
        │   └── public-media/
        │       ├── route.ts            ← new (GET list, POST create folder, DELETE file)
        │       └── upload/
        │           └── route.ts        ← new (POST multipart upload)
        └── public-media/
            ├── page.tsx                ← new (server shell, requireAdmin)
            └── PublicMediaClient.tsx   ← new (client UI)

public/
└── uploads/                            ← auto-created on first upload
    └── .gitkeep                        ← so the folder is tracked by git
```

---

## Public URL Convention

Files uploaded to `public/uploads/hero.webp` are accessible at:
```
https://example.com/uploads/hero.webp
```
In development: `http://localhost:3000/uploads/hero.webp`

Sub-folder files (`public/uploads/banners/sale.jpg`) are accessible at:
```
https://example.com/uploads/banners/sale.jpg
```

---

## Quality Gates

- `npx tsc --noEmit` — 0 errors.
- `npx eslint . --max-warnings 0` — 0 warnings.
- `npx vitest run` — all prior tests plus new cases pass.
