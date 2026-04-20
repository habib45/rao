-- 00003_enable_rls.sql
-- Phase 2: Enable Row Level Security on all tables and create access policies.

-- Enable RLS on all 7 tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations_ui ENABLE ROW LEVEL SECURITY;

-- categories: anonymous can read active categories
CREATE POLICY categories_select_active ON categories
  FOR SELECT USING (is_active = true);

-- products: anonymous can read active products
CREATE POLICY products_select_active ON products
  FOR SELECT USING (is_active = true);

-- product_images: anonymous can read all images
CREATE POLICY product_images_select_all ON product_images
  FOR SELECT USING (true);

-- click_tracking: anyone can insert a click event
CREATE POLICY clicks_insert_own ON click_tracking
  FOR INSERT WITH CHECK (true);

-- cart_items: session-scoped CRUD
CREATE POLICY cart_select_own ON cart_items
  FOR SELECT USING (
    session_id = coalesce(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  );

CREATE POLICY cart_insert_own ON cart_items
  FOR INSERT WITH CHECK (
    session_id = coalesce(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  );

CREATE POLICY cart_update_own ON cart_items
  FOR UPDATE USING (
    session_id = coalesce(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  ) WITH CHECK (
    session_id = coalesce(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  );

CREATE POLICY cart_delete_own ON cart_items
  FOR DELETE USING (
    session_id = coalesce(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  );

-- price_history: anonymous can read all price history
CREATE POLICY price_history_select_all ON price_history
  FOR SELECT USING (true);

-- translations_ui: anonymous can read all translations
CREATE POLICY translations_select_all ON translations_ui
  FOR SELECT USING (true);
