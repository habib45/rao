# Phase 11 — Test Matrix

Every row is a Vitest test case. Existing tests must remain green. Target: grow the suite by ~20 cases.

| # | File | Case | Assertion |
|---|---|---|---|
| 1 | `src/app/admin/_components/ui/__tests__/RichTextEditor.test.tsx` | Renders toolbar buttons | Bold, Italic, Underline, Strike, H1, H2, H3, bullet list, ordered list, table, link, image, align-left, align-center, align-right, color, highlight, undo, redo are all in the document. |
| 2 | same | Bold toggle updates HTML | Clicking Bold then typing produces `<strong>` in the onChange payload. |
| 3 | same | Accepts initial HTML | Mounting with `value="<p>hi</p>"` renders "hi" in the editable area. |
| 4 | same | onChange fires on content change | `onChange` is called with an HTML string containing typed characters. |
| 5 | `src/app/admin/products/new/_components/__tests__/ProductCreateForm.test.tsx` | Renders all tabs | Tab labels "General", "English", "Bangla", "Swedish", "Features", "Pricing", "Images", "SEO" all present. |
| 6 | same | Save as Draft posts product_status=draft | Submit calls fetch to products endpoint with body including `product_status: 'draft'`. |
| 7 | same | Submit for Review posts product_status=pending_review | Submit calls fetch with `product_status: 'pending_review'`. |
| 8 | same | ASIN import fills English title | When import API resolves with `{ name: { en: 'Widget' } }`, the English Title input receives "Widget". |
| 9 | same | Validation error highlights ASIN field | 400 response from import API surfaces inline error. |
| 10 | `src/app/admin/api/products/[id]/__tests__/approve.test.ts` | 200 on approve from pending | Given a product with `product_status='pending_review'`, POST returns 200 and updates to `approved`. |
| 11 | same | 409 when not pending | Given `product_status='draft'`, POST returns 409. |
| 12 | `src/app/admin/api/products/[id]/__tests__/reject.test.ts` | 400 on missing reason | POST with empty body returns 400 Zod error. |
| 13 | same | 200 on valid reject | POST with `{ reason: 'too thin' }` sets `product_status='draft'` and `rejection_reason='too thin'`. |
| 14 | `src/app/admin/api/products/[id]/__tests__/publish.test.ts` | 200 on publish from approved | POST updates `product_status='published'`, `is_active=true`. |
| 15 | same | 409 when not approved | POST returns 409 if current status is `draft`. |
| 16 | `src/app/admin/api/__tests__/products.test.ts` (extend) | PATCH accepts product_status | Patch body with `product_status='pending_review'` passes Zod + updates. |
| 17 | `src/app/admin/products/review/_components/__tests__/ReviewQueueTable.test.tsx` | Renders pending rows | Given two pending products, both names visible plus Approve/Reject buttons. |
| 18 | same | Reject dialog requires reason | Clicking Reject opens a dialog; submit is disabled until reason has >=5 chars. |
| 19 | `src/app/admin/_components/__tests__/AdminShell.test.tsx` (new) | Shows Review Queue badge | When `pendingCount=3`, badge renders "3". |
| 20 | same | Hides badge when count is 0 | Badge not rendered when `pendingCount=0`. |

### Phase 11.4 — Product Editor Revamp

| # | File | Case | Assertion |
|---|---|---|---|
| 21 | `src/lib/images/__tests__/dedup.test.ts` | Identical pHash, different URLs | `deduplicateImages` returns `{ kept: 1, dropped: 1 }` with the lower-sort-order row surviving. |
| 22 | same | Near-duplicate by color histogram (cosine 0.97) | Clustered; the second row is dropped with `reason: 'color_hist'` and `duplicate_of` pointing at the kept URL. |
| 23 | `src/app/admin/products/[id]/_components/__tests__/ProductEditForm.dedup.test.tsx` | Remove image #3 → Save → Reload | Image #3 does not reappear; `form.images.length === 3` on remount. |
| 24 | same | Save interrupted mid-loop | Mock gateway PUT throws; form shows error toast; client retains the 4-image list; on next attempt the canonical state is restored from the server echo. |
| 25 | `src/app/admin/products/[id]/_components/__tests__/PreviewButton.test.tsx` | Draft preview (no slug, `is_active=false`) | Click → mints token → opens `/en/products/<id>?preview=…` in a new tab; `Cache-Control: no-store` present in mock response headers; banner visible in rendered output. |
| 26 | same | Expired token | HMAC with `exp` in the past renders the "Preview link expired" page. |
| 27 | same | Tampered token (one byte flipped in HMAC) | Same 404. |
| 28 | `src/app/admin/products/[id]/_components/__tests__/SeoAssistant.test.tsx` | Meta title too long (`'x'.repeat(70)`) | Score: 0 for title length; suggests a 60-char rewrite via AI route (mocked). |
| 29 | `src/app/admin/api/ai/grammar/__tests__/route.test.ts` | English sentence with 3 known errors | POST returns ≥3 matches, each with `start`, `end`, `message`, `replacement`, and `rule.id`. |
| 30 | `src/app/admin/products/[id]/_components/__tests__/WizardNavigation.test.tsx` | Refresh on step 3 | URL contains `?step=3`; wizard mounts on step 3; form values restored from `sessionStorage`. |
| 31 | `src/app/admin/products/[id]/_components/__tests__/Autosave.test.tsx` | Idle 10 s, no edits | Mock `Date.now` advancing 11 s; exactly 1 PATCH fires with `body._autosave === true`. |
| 32 | same | Continuous typing (keystrokes every 1 s for 30 s) | Total PATCH count ≤ 3 (10 s hard cap enforced). |
| 33 | same | Server-side conflict | Server returns `updated_at` 2 min newer than mount-time; banner shows "Remote changes detected"; autosave paused until resolved. |
| 34 | `src/app/admin/products/_components/__tests__/ProductsTable.preview.test.tsx` | Click Eye on row #0 | `window.open` called with the mint route → public URL (round-tripped). |
| 35 | `src/app/admin/products/[id]/_components/__tests__/ConflictBanner.test.tsx` | Click "Keep mine" | Form PATCH resends the last known good state; banner dismissed; server response is a no-op (lastWriterWins). |
| 36 | `src/app/admin/api/products/[id]/__tests__/preview-token.test.ts` | Mint token with `userId` binding | Payload decodes to `{ id, userId, locale, exp }`; HMAC verifies; tampered userId fails verification. |
| 37 | `src/app/admin/api/ai/seo-suggest/__tests__/route.test.ts` | AI route rate-limit | 21st call within 60 s returns 429 with `{ error: 'rate_limited' }` (capacity 20). |
| 38 | `scripts/__tests__/check-locale-parity.test.ts` | New wizard strings shipped in all locales | Adding a new key to `messages/en.json` without `bn-BD.json` / `sv.json` fails the parity check with a clear diff. |

### Phase 11.5 — Orphan Upload Cleanup

| # | File | Case | Assertion |
|---|---|---|---|
| 39 | `src/lib/uploads/__tests__/remove-orphan-uploads.test.ts` | External URL is ignored | Given `previous=[https://m.media-amazon.com/x.jpg]` and `next=[]`, outcome.unlinked is empty, outcome.externalIgnored contains the URL, no file system call is made. |
| 40 | same | Local `/uploads/` URL is unlinked | Given `previous=[/uploads/products/a.jpg]` (real file in tmpdir) and `next=[]`, file is gone after the call; outcome.unlinked contains the URL. |
| 41 | same | Path-traversal URL is rejected | `/uploads/../etc/passwd` resolves to a path outside the uploads root; outcome.unsafeIgnored contains the URL; the target file (if any) is NOT unlinked. |
| 42 | same | Null-byte URL is rejected | `/uploads/x.jpg\0evil` returns null from `resolveSafeUploadPath`; outcome.unsafeIgnored contains it. |
| 43 | same | ENOENT is a no-op | Given a `/uploads/` URL whose file does not exist, outcome.unlinked still contains it (treated as success) and outcome.failed is empty. |
| 44 | same | URL kept in next list is preserved | Given `previous=[/uploads/products/a.jpg, /uploads/products/b.jpg]` and `next=[/uploads/products/a.jpg]`, only `b.jpg` is unlinked; `a.jpg` survives. |
| 45 | same | Shared URL is preserved by default | Given `previous=[/uploads/products/shared.jpg]` and `next=[]`, without an `isUrlStillReferenced` oracle the file is preserved (conservative default); outcome.preservedShared contains the URL. |
| 46 | same | `isUrlStillReferenced` oracle preserves file | Given the same setup with oracle returning `true`, the file is preserved; outcome.preservedShared contains the URL. |
| 47 | same | `isUrlStillReferenced` oracle returning false permits unlink | Given oracle returning `false`, the file is unlinked; outcome.unlinked contains the URL. |
| 48 | same | Real I/O error captured in failed[] | Mock `fs.unlink` to throw `EISDIR`; outcome.failed contains `{ url, error: 'EISDIR...' }`. |
| 49 | same | `FEATURE_REMOVE_ORPHAN_UPLOADS=false` disables unlink | `isRemoveOrphanUploadsEnabled()` returns false; PATCH route should NOT call the helper (verified by inspecting the route's import-and-call structure, not by I/O). |
| 50 | same | `FEATURE_REMOVE_ORPHAN_UPLOADS=true` enables unlink | `isRemoveOrphanUploadsEnabled()` returns true when env var is the literal string `"true"`. |
| 51 | same | Garbage env values resolve to false | Values like `"yes"`, `"1"`, `"on"`, `"TRUE"` (uppercase) resolve to false. Only the lowercase string `"true"` enables. |
| 52 | same | URL with `%2e%2e` percent-encoded | `/uploads/%2e%2e/foo.jpg` is rejected as unsafe. |
| 53 | same | Multiple orphans unlinked atomically | Given three previous URLs and three next URLs (two overlap, one dropped), only the one dropped URL is unlinked; idempotent across repeated calls. |
| 54 | same | Helper does not throw when `previousImages` fetch failed | `removeOrphanUploads({ previous: [], next: [] })` returns an empty outcome and does not throw. |

## Supporting Stubs
- Supabase stubs must be thenable (`then(resolve, reject)`).
- `next/dynamic` mocked in tests that import the rich editor to render a plain `<textarea>` substitute.
- `vi.hoisted()` for shared mocks.
- `server-only` aliased via the existing vitest `alias` config.
- `globalThis.fetch` is mocked in `dedup.test.ts` to return deterministic image bytes — never make real network calls in unit tests.

## Quality Gates
- `npx tsc --noEmit` — 0 errors.
- `npx eslint . --max-warnings 0` — 0 warnings.
- `npx vitest run` — all prior suites plus these new cases pass.
- Coverage ≥ 90 % on touched files; ≥ 100 % on `src/lib/images/dedup.ts`, `src/app/admin/api/ai/grammar/route.ts`, `src/app/admin/api/products/[id]/preview-token/route.ts`, `src/app/admin/api/ai/seo-suggest/route.ts`.
