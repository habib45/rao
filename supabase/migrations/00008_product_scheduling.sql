-- 00008_product_scheduling.sql
-- Phase 9: Scheduled product publishing.
-- Adds a publish_at timestamp to products and a helper function that
-- activates any draft products whose scheduled time has arrived.

-- 1) Schedule column
ALTER TABLE products
  ADD COLUMN publish_at TIMESTAMPTZ NULL;

-- 2) Partial index: we only ever query drafts awaiting publication
CREATE INDEX idx_products_publish_at
  ON products (publish_at)
  WHERE publish_at IS NOT NULL AND is_active = FALSE;

-- 3) RPC — advances due drafts to active and returns how many were updated.
-- SECURITY DEFINER lets the hourly Edge Function call it via the service role
-- without needing row-level privileges on the products table.
CREATE OR REPLACE FUNCTION publish_scheduled_products()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE products
  SET is_active = TRUE,
      publish_at = NULL,
      updated_at = NOW()
  WHERE publish_at IS NOT NULL
    AND publish_at <= NOW()
    AND is_active = FALSE;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
