-- =============================================================
-- 003_create_triggers.sql
-- MySQL 8.0+ equivalent of Supabase migrations:
--   00004_create_triggers.sql
--   00006_admin_rls.sql  (admin_settings trigger)
--
-- KEY DIFFERENCES vs PostgreSQL:
--
-- 1. No shared trigger function: MySQL triggers cannot call a shared
--    procedure body the way PostgreSQL does with EXECUTE FUNCTION
--    set_updated_at(). Each table gets its own inline BEFORE UPDATE trigger.
--
-- 2. No search vector trigger needed: search_text_en/bn/sv are GENERATED
--    ALWAYS AS columns in MySQL. They recompute automatically on every
--    INSERT and UPDATE — no trigger equivalent to update_product_search_vectors()
--    is required.
--
-- 3. DELIMITER syntax: required when trigger bodies contain semicolons.
--    If using a programmatic migration runner (golang-migrate, Flyway, etc.)
--    that splits on ;; or handles DELIMITER automatically, adjust accordingly.
-- =============================================================

DELIMITER ;;

-- categories
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END;;

-- products
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END;;

-- cart_items
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END;;

-- translations_ui
CREATE TRIGGER trg_translations_ui_updated_at
  BEFORE UPDATE ON translations_ui
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END;;

-- admin_settings  (from 00006_admin_rls.sql)
CREATE TRIGGER trg_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END;;

DELIMITER ;
