-- 00020_comparison.sql
-- Adds show_in_comparison flag to products and seeds comparison_keys in admin_settings.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS show_in_comparison BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_show_in_comparison
  ON products (show_in_comparison)
  WHERE show_in_comparison = true;

-- Seed default comparison keys (safe upsert)
INSERT INTO admin_settings (key, value)
VALUES (
  'comparison',
  '{"keys": ["Color", "Weight", "Power Type", "Battery Life", "Cleaning Path", "Accessories Included", "Warranty", "Dimensions", "Material", "Connectivity"]}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
