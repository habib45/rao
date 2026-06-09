---
name: Phases 10-13 Plan Scope (post-Phase 9)
description: Phase 10 is a retrospective docs-only entry; Phases 11-13 are planned but not yet implemented. Captures workflow decisions and scope signals.
type: project
---

Phase 10 = retrospective documentation of a UI redesign that shipped before the docs sweep. No code was produced in this phase — it is "complete" only because the files it documents were already merged.

Phase 11 = product_status workflow (draft/pending_review/approved/published), TipTap rich-text editor, product creation form (/admin/products/new), review queue page, 3 new API routes (approve/reject/publish), migration 009_product_workflow.sql.

Phase 12 = public product reviews with cookie-based own-pending visibility, admin moderation page, migration 010_product_reviews.sql.

Phase 13 = File System media manager (public folder), folder via `.keep` placeholder convention, embedded MediaPickerDialog for product forms.

**Why:** User asked for all 4 phases to be delivered in one session on top of a 332-test baseline with strict quality gates (tsc, eslint --max-warnings 0, vitest run all green). Phase 10 docs were the ONLY deliverable that fit cleanly in the docs-first workflow; Phase 11-13 coding was out of scope for a single turn and was handed back to the user for phased approval.

**How to apply:** When resuming Phase 11 coding, the TipTap install is the first blocker — `npm install` for 15 packages must happen before any component code. Existing Zod `productUpdateSchema` already has most fields; only `product_status` needs adding. `getScheduledProducts()` already lives in `src/app/admin/_lib/queries/dashboard.ts` (Phase 9). The migration should be idempotent and backfill from `is_active`.
