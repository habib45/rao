# Phase 22 — QA-Driven Hardening of Admin Product Edit + Image Upload

**Status:** 🟡 Drafted — driven by `senior-qa` skill findings from test runs on 2026-08-07.
**Scope:** `src/app/admin/products/[id]/_components/ProductEditForm.tsx`, `src/app/admin/products/_components/ProductImageEditor.tsx`, the PATCH route `src/app/admin/api/products/[id]/route.ts`, and the per-image DELETE route `src/app/admin/api/products/[id]/images/[imageId]/route.ts`.

---

## 22.1 — QA Findings (from `npx vitest run` on 2026-08-07)

`npx vitest run` was executed across the full suite (`src/**/*.test.{ts,tsx}`). **598 tests passed, 11 failed in 3 files.** Of those 11 failures, the ones that touch the admin product edit form / image upload surface are reproduced below. Failures unrelated to this scope (`RichTextEditor`, `messages`, `sitemap` schema drift) are listed for transparency but explicitly out of scope and will be tracked under separate phases.

### A. `productUpdateSchema` — `src/app/admin/_lib/schemas/product.ts`

The `ProductEditForm` posts the entire `form` state to `PATCH /admin/api/products/[id]`. That route validates with `productUpdateSchema`. Today the schema rejects the canonical fixture produced by the form, which means **real saves from the UI are silently turned into 400 Validation Errors** (only visible if the user inspects DevTools).

| Failing test | Cause | Why it breaks the form |
|---|---|---|
| `accepts a fully populated valid object` | `validProduct` fixture is missing `show_in_comparison`, which the schema now requires. | `ProductEditForm.tsx` line 95–96 sets `show_in_comparison: Boolean(product.show_in_comparison ?? false)` and sends it on every save. → 400. |
| `accepts all valid availability values` | same — fixture missing `show_in_comparison`. | All availability branches hit the same rejection. |
| `accepts discount_pct at boundaries (0 and 100)` | same. | 0/100 boundary saves still fail. |
| `accepts null price_cents` | same. | Pricing tab → null price still fails. |
| `defaults currency to USD when omitted` | same. | Editing only the "Active" toggle drops currency; the empty string would now fail validation. |

**Fix:** update the `validProduct` fixture in `src/app/admin/_lib/__tests__/schemas.test.ts` to include `show_in_comparison: false`. This is the *correct* shape — the schema is right; the fixture is stale.

### B. `sitemapCustomEntrySchema` — `src/app/admin/_lib/schemas/sitemap.ts`

Out of scope for the product-edit surface but flagged so we don't lose track:

| Failing test | Cause |
|---|---|
| `accepts a valid entry` | The schema's `SITE_URL` default is `https://raofinds.com` (hard-coded) while the test reads `NEXT_PUBLIC_SITE_URL ?? "https://bestfinds.com"`. The two diverge. |

### C. `messages.test.ts` — locale parity

Out of scope for product edit, but flagged: `contact.*` keys (and `affiliateDisclaimer.contact_email`) exist in `messages/en.json` but are absent from `bn-BD.json` and `sv.json`. Will be fixed under a follow-up parity plan.

### D. `RichTextEditor.test.tsx`

Out of scope for product edit. The mock for `ckeditor5` is missing the `FontSize`, `FontFamily`, `FontColor` exports. The product-edit form uses `RichTextEditor` dynamically (`ssr: false`), so this can leak into any tests that mount `ProductEditForm`. Will be fixed under Phase 23.

### E. **Issue found via stderr during existing-image tests (route-level)**

When the route runs the orphan-cleanup pass with the default `mockRemoveOrphanUploads` returning `undefined`, the route logs:

```
[product-images] orphan cleanup threw TypeError: Cannot read properties of undefined (reading 'unlinked')
```

This is harmless in the current test (the route catches the throw), but it tells us that **production callers that supply `removeOrphanUploads()`'s default return shape will trip a real `TypeError` in the catch branch if the cleanup throws** — the catch block reads `outcome.unlinked` from the wrapped object before logging. Should be hardened. (See §22.5.)

---

## 22.2 — Test Gaps in the Product Edit + Image Upload Surface

Today there is **no** component-level test for either `ProductEditForm.tsx` or `ProductImageEditor.tsx`. The only coverage is at the API-route level (`product-images-reconcile.test.ts`, `product-images-cleanup.test.ts`, `delete-image.test.ts`) and that coverage is now passing. The component-level behaviour — drag/drop, paste, file upload, alt-text editing, media-picker, image delete from the form, save-error handling — is **untested**.

### Test cases to add

#### `src/app/admin/products/_components/__tests__/ProductImageEditor.test.tsx`

| # | Case | Assertion |
|---|---|---|
| 1 | Renders empty state | "No images yet" copy + drop zone visible. |
| 2 | Renders existing images | Image grid populated; `aria-label="Set as primary"` only on non-primary cards. |
| 3 | Star click sets primary | Clicking star on image #2 moves it to index 0; toast fired. |
| 4 | Move up/down buttons reorder | Up on #2 moves it to #1; Up on #0 is disabled. |
| 5 | Bulk alt text applies to every image (EN locale only) | After applying, each `img.alt.en` equals the input text. |
| 6 | Per-image alt-text editing | Three locale inputs (EN/BN/SV) appear when ALT is clicked; typing updates state. |
| 7 | "Clear all" prompts confirm | Without confirm, the list is unchanged. With confirm-mock → empty list. |
| 8 | Manual URL add (valid + invalid) | Valid `https://…` is appended; invalid `not-a-url` shows toast and does not append. |
| 9 | **File upload via input** (mocked `/admin/api/public-media/upload`) | Optimistic placeholder appears; on 200 it gets replaced with the returned URL; on 500 a toast fires and placeholder stays in `uploadError` state. |
| 10 | **File upload oversized** (>10 MB) | Toast fires; nothing is appended. |
| 11 | **Clipboard paste** | Construct `DataTransfer` with image items; verify `uploadFiles` is invoked. |
| 12 | **Drag/drop reorder** | Simulate dragstart/dragover/drop; images reorder. |
| 13 | **Drag/drop new files into the drop zone** | Files trigger `uploadFiles`; optimistic placeholders visible. |
| 14 | **Remove image that has a server id** | Calls `onRemoveById(id)`; after promise resolves, the image is dropped. |
| 15 | **Remove image that has no server id** | Drops locally; does **not** call `onRemoveById`. |
| 16 | **Media picker dialog** | Clicking "Pick from media" opens dialog; selecting a tile + "Choose" appends the URL with `source: "picker"`. |
| 17 | **Duplicate URLs are de-duplicated** | Adding the same URL twice keeps only one row (uses the existing `appendUnique`). |
| 18 | **Move-image past boundaries is a no-op** | `moveImage(0, -1)` and `moveImage(N, N+1)` are no-ops. |

#### `src/app/admin/products/[id]/_components/__tests__/ProductEditForm.test.tsx`

| # | Case | Assertion |
|---|---|---|
| 19 | Loads product into form state | Inputs reflect `product.name.en`, `product.brand`, `product.currency`, etc. |
| 20 | **Save → PATCH body contains `images` with `is_primary`/`sort_order` filled** | Each image has `is_primary`, `sort_order`, `url`. |
| 21 | **Save error** (PATCH returns 500) | toast.error is fired; form state is preserved. |
| 22 | **Removed image reappears on save** | This is the canonical Phase-11.4.1 regression — keep it green. The current route-level test in `product-images-reconcile.test.ts > "deletes rows whose URL is no longer in payload"` pins it. We add a component-level counterpart that mounts the form, removes image #2, saves, and asserts `body.images` no longer contains the dropped URL. |
| 23 | **Image delete uses the per-row DELETE endpoint** | When `ProductImageEditor` removes an image with an id, `fetch(.../images/<id>, DELETE)` is called. |
| 24 | **Switching locale tabs in description editor preserves content per locale** | Editing `en`, switching to `bn-BD`, edits `bn-BD`; switching back shows the `en` content untouched. |
| 25 | **Wizard block: insert → edit → delete** | Insert a wizard via `WizardBuilder`, the marker appears in the description; "Delete" removes the wrapping `<div data-wizard=…>`; the surrounding content is preserved. |
| 26 | **Comparison block: same insert/edit/delete contract** | Mirrors the wizard test for `data-comparison=…`. |
| 27 | **Attributes editor: add/remove rows** | Two attribute rows render; removing one keeps the other. |
| 28 | **ForceSyncButton click** | Renders the button; clicking calls its handler (we mock `ForceSyncButton`). |
| 29 | **Reconciliation response surfaces `images_partial`** | When the PATCH response carries `images_partial: true`, the form surfaces a warning toast (or a banner — we'll decide while implementing). |
| 30 | **Active toggle round-trips** | Toggling `is_active` and saving puts the new value in the PATCH body. |

---

## 22.3 — Acceptance Criteria

Phase 22 is "done" when **all** of the following hold:

- [ ] The 7 currently failing tests in `schemas.test.ts` + `sitemap.test.ts` related to product update are green.
- [ ] Both new test files (18 + 30 cases above) pass on `npx vitest run`.
- [ ] `npx vitest run` reports **0** failures in any test file that imports `ProductEditForm.tsx` or `ProductImageEditor.tsx` directly or transitively.
- [ ] No new lint warnings (`npx eslint` clean on the modified files).
- [ ] Coverage delta for `ProductEditForm.tsx` ≥ 60 % lines, `ProductImageEditor.tsx` ≥ 70 % lines.

---

## 22.4 — Plan

| Step | Owner | Description |
|---|---|---|
| 1 | senior-qa | Land the test-matrix additions (this file). |
| 2 | senior-qa | Add the two new test files (skipped tests can be staged behind `it.todo` until the code is ready). |
| 3 | senior-qa | Run vitest → list failures with line numbers and stack frames. |
| 4 | senior-frontend | Fix each failing case (surgical edits, no over-reach). |
| 5 | senior-qa | Re-run vitest. Repeat 3–4 until green. |
| 6 | senior-qa | Final pass: `npx eslint`, then `npx vitest run` end-to-end. |

---

## 22.5 — Hardening of the PATCH route's orphan-cleanup catch (small bonus)

The route's cleanup `catch` block does:

```ts
catch (err) {
  console.warn("[product-images] orphan cleanup threw", err);
  orphanCleanup = { ...orphanCleanup, skipped: true };
}
```

This is safe because the spread `...orphanCleanup` copies the previously-set defaults. **However**, before this block runs, the route already assigned `orphanCleanup = { unlinked: [], failed: [], … }` (the default-empty literal). If a future maintainer changes the default shape, the catch will fail silently. Pin this with a regression test that asserts: when `removeOrphanUploads` rejects, the response `file_unlink.skipped === true` and the request returns 200. (Already exists as `propagates a thrown cleanup as a skip without breaking the response` — keep it green.)

---

## 22.6 — Out of Scope (filed for later phases)

- `RichTextEditor.test.tsx` ckeditor5 mock — Phase 23.
- `messages.test.ts` locale parity (contact.* etc.) — Phase 24.
- `sitemapCustomEntrySchema` `SITE_URL` mismatch — Phase 25.