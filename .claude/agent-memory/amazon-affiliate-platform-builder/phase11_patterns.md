---
name: Phase 11 Implementation Patterns — Workflow + RichTextEditor
description: Non-obvious patterns discovered while adding the product approval workflow, TipTap editor, and creation form
type: project
---

Phase 11 (April 2026) added the product_status workflow (draft/pending_review/approved/published), TipTap rich-text editor, product creation form (`/admin/products/new`), review queue page, three workflow API routes (approve/reject/publish), and migration `009_product_workflow.sql`.

**Why:** Editorial pipeline lets staff submit drafts for review before they go live; rejected items keep their reason for follow-up.

**How to apply:** When extending these flows:
- TipTap v3 (3.22.x) `Table` and `TextStyle` extensions do NOT have a default export — use `import { Table } from "@tiptap/extension-table"` and `import { TextStyle } from "@tiptap/extension-text-style"`. Most other extensions (`Image`, `Link`, `Underline`, `Highlight`, `Placeholder`, `TableRow/Cell/Header`, `TextAlign`, `StarterKit`) DO have default exports.
- `useEditor` must use `immediatelyRender: false` to avoid SSR hydration mismatches in Next.js 15. Always import the editor with `dynamic(() => import("..."), { ssr: false })`.
- AdminShell sidebar active-state uses `pathname.startsWith(href)` — adding `/admin/products/review` next to `/admin/products` requires exact-match handling for the parent route to prevent both highlighting at once. Codified via `exactMatchRoutes` array in `AdminShell.tsx`.
- `request.nextUrl.searchParams` in route handlers is synchronous — the Next.js 15+ async `searchParams` API change applies only to the prop on `page.tsx` server components, not to NextRequest.
- Workflow API routes follow a per-table dispatcher mock pattern: `from(table)` returns `{ update, eq, select, single }` with the `single` mock resolving the chain — this matches the existing `import.test.ts` style and avoids the thenable-stub awkwardness for chained `.update().eq().select().single()`.
- For ReviewActions tests, mock `next/navigation` and `sonner` with `vi.hoisted()` to share refs between `vi.mock` factories and assertions.
- Tailwind v4: prefer canonical sizing classes like `min-h-50` over `min-h-[200px]` — the IDE diagnostic flags arbitrary values that have a shorthand equivalent.
