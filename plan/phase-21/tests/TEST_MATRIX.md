# Phase 21 — Test Matrix

## API Route: GET /admin/api/public-media

| # | Case | Expected |
|---|---|---|
| 1 | Root folder, directory has files + subfolders | Returns `{ items }` with folders first then images |
| 2 | Sub-folder path `?folder=banners` | Lists only contents of `public/uploads/banners/` |
| 3 | `.gitkeep` files present | Filtered out of response |
| 4 | Non-image files present (e.g. `.txt`) | Filtered out — only image extensions returned |
| 5 | Empty directory | Returns `{ items: [] }` |
| 6 | `folder` contains `..` | 400 Bad Request |

## API Route: DELETE /admin/api/public-media

| # | Case | Expected |
|---|---|---|
| 7 | Valid image path | File deleted, `{ ok: true }` |
| 8 | Missing `path` param | 400 Bad Request |
| 9 | Path contains `..` traversal | 400 Bad Request |
| 10 | File does not exist | 404 Not Found |

## API Route: POST /admin/api/public-media (create folder)

| # | Case | Expected |
|---|---|---|
| 11 | Valid `folderName` | Directory created, `{ path }` returned |
| 12 | `folderName` contains `/` or `..` | 400 Bad Request |
| 13 | `folderName` empty string | 400 Bad Request |

## API Route: POST /admin/api/public-media/upload

| # | Case | Expected |
|---|---|---|
| 14 | Single valid image file | Written to disk, `{ ok: true, paths }` returned |
| 15 | Multiple files in one request | All written, all paths returned |
| 16 | File > 10 MB | 413 Request Entity Too Large |
| 17 | Non-image MIME type (`text/plain`) | 400 Bad Request |
| 18 | `folder` contains `..` | 400 Bad Request |
| 19 | Sub-folder does not exist yet | Directory auto-created before write |

## UI Component: PublicMediaClient

| # | Case | Expected |
|---|---|---|
| 20 | Renders loading state | Shows "Loading media..." text |
| 21 | Renders empty state | Shows "No media files" message |
| 22 | Renders folder cards | Folder icon + name visible |
| 23 | Renders image cards | `next/image` + filename + size |
| 24 | Copy URL button click | Clipboard write called with `/uploads/<path>` |
| 25 | Delete button → confirm → success | Re-fetch triggered |
| 26 | Create folder modal submit | POST fired, modal closes |
| 27 | Breadcrumb navigation | Clicking part sets correct `currentFolder` |
