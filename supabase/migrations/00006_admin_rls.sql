-- 00006_admin_rls.sql
-- Admin panel: RLS policies for admin users + admin_settings + sync_logs tables.

-- ============================================================
-- Admin CRUD policies on existing tables
-- Uses app_metadata.role = 'admin' embedded in the Supabase JWT
-- ============================================================

CREATE POLICY admin_all_categories ON categories
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_all_products ON products
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_all_product_images ON product_images
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_all_click_tracking ON click_tracking
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_all_cart_items ON cart_items
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_all_price_history ON price_history
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_all_translations_ui ON translations_ui
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- admin_settings table — key/value config for admin panel
-- ============================================================

CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_settings ON admin_settings
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Auto-update updated_at trigger
CREATE TRIGGER set_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Seed default settings
INSERT INTO admin_settings (key, value) VALUES
  ('affiliate', '{"default_tag": "bestfinds-20", "tags": {"en": "bestfinds-20", "bn-BD": "bestfinds-bd-20", "sv": "bestfinds-sv-20"}, "marketplace": "www.amazon.com"}'::jsonb),
  ('sync', '{"product_interval_hours": 168, "price_interval_hours": 24, "enabled": true}'::jsonb),
  ('features', '{"enable_cart": true, "enable_search": true, "enable_tracking": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- sync_logs table — tracks Edge Function execution history
-- ============================================================

CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'error')),
  items_processed INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read/manage sync logs
CREATE POLICY admin_all_sync_logs ON sync_logs
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Edge Functions (service role) can insert sync logs
CREATE POLICY sync_logs_service_insert ON sync_logs
  FOR INSERT
  WITH CHECK (true);

-- Index for querying recent logs
CREATE INDEX idx_sync_logs_started_at ON sync_logs (started_at DESC);
CREATE INDEX idx_sync_logs_function_name ON sync_logs (function_name);
