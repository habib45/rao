# Phase 13 — Test Matrix

| # | File | Case | Assertion |
|---|---|---|---|
| 1 | `src/app/admin/_components/media/__tests__/FileGrid.test.tsx` | Renders file cards | Given two image entries, both are rendered with filename + size. |
| 2 | same | Copy URL button | Clicking Copy URL writes the public URL to navigator.clipboard. |
| 3 | same | Delete button fires DELETE | Clicking Delete calls the DELETE route with the file path. |
| 4 | `src/app/admin/_components/media/__tests__/FolderTree.test.tsx` | Renders folders | Given folders `['images','banners']`, both nodes appear. |
| 5 | same | Clicking a folder updates path | Click dispatches `?path=...` navigation. |
| 6 | `src/app/admin/_components/media/__tests__/UploadDropzone.test.tsx` | File input accepts images | `accept="image/*"` attribute set. |
| 7 | same | POSTs FormData to upload route | Selecting a file calls `/admin/api/media/upload`. |
| 8 | `src/app/admin/_components/media/__tests__/CreateFolderDialog.test.tsx` | Validation rejects invalid names | Typing `bad/name` shows validation error and disables Create. |
| 9 | same | Valid name posts to media route | Create calls POST with `{ folderName: 'new-folder' }`. |
| 10 | `src/app/admin/api/media/__tests__/get.test.ts` | Lists files + folders | Mock returns mixed entries; response groups folders and files correctly. |
| 11 | `src/app/admin/api/media/__tests__/post.test.ts` | Creates folder via .keep upload | POST uploads a zero-byte file named `.keep` under the given path. |
| 12 | `src/app/admin/api/media/upload/__tests__/post.test.ts` | Rejects non-image MIME | FormData with text/plain returns 400. |
| 13 | same | Rejects >5MB file | Oversized file returns 413. |
| 14 | `src/app/admin/api/media/[...path]/__tests__/delete.test.ts` | Deletes file | DELETE with image path removes exactly that object. |
| 15 | same | Deletes folder | DELETE with folder path removes `.keep` + all children. |
| 16 | `src/app/admin/_components/media/__tests__/MediaPickerDialog.test.tsx` | Choose returns URL | Selecting a file and confirming calls `onClose` with the URL. |

## Quality Gates
- `npx tsc --noEmit` — 0 errors.
- `npx eslint . --max-warnings 0` — 0 warnings.
- `npx vitest run` — all prior tests plus these new ones pass.
