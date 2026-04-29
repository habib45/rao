-- 00009_product_workflow.sql
-- Phase 11: Product approval workflow.
-- Adds a status column tracking the editorial pipeline:
--   draft → pending_review → approved → published.
-- Idempotent so it can be re-applied during dev without error.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (product_status IN ('draft','pending_review','approved','published')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS submitted_by TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_products_status ON products(product_status);
