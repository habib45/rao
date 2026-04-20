-- 00004_create_triggers.sql
-- Phase 2: Functions and triggers for auto-updating timestamps and search vectors.

-- Function: auto-set updated_at on row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: update product search vectors from JSONB name/description/brand
CREATE OR REPLACE FUNCTION update_product_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector_en = to_tsvector('english',
    coalesce(NEW.name->>'en', '') || ' ' ||
    coalesce(NEW.description->>'en', '') || ' ' ||
    coalesce(NEW.brand, ''));
  NEW.search_vector_bn = to_tsvector('simple',
    coalesce(NEW.name->>'bn-BD', '') || ' ' ||
    coalesce(NEW.description->>'bn-BD', ''));
  NEW.search_vector_sv = to_tsvector('simple',
    coalesce(NEW.name->>'sv', '') || ' ' ||
    coalesce(NEW.description->>'sv', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: auto-update updated_at
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_translations_ui_updated_at
  BEFORE UPDATE ON translations_ui
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: auto-update product search vectors on insert/update
CREATE TRIGGER trg_products_search_vectors
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vectors();
