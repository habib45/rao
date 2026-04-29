-- 00010_product_attributes.sql
-- Adds a flexible JSONB column for storing Amazon catalog attributes
-- (model_number, color, size, weight, dimensions, warranty, etc.)
-- that do not warrant individual columns.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_attributes_gin ON products USING GIN (attributes);
