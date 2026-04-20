-- 00002_create_indexes.sql
-- Phase 2: GIN indexes on JSONB/tsvector, B-tree indexes on FKs and query columns.

-- GIN indexes on JSONB columns
CREATE INDEX idx_categories_name_gin ON categories USING GIN (name);
CREATE INDEX idx_categories_slug_gin ON categories USING GIN (slug);
CREATE INDEX idx_products_name_gin ON products USING GIN (name);
CREATE INDEX idx_products_slug_gin ON products USING GIN (slug);
CREATE INDEX idx_products_description_gin ON products USING GIN (description);
CREATE INDEX idx_product_images_alt_text_gin ON product_images USING GIN (alt_text);
CREATE INDEX idx_translations_ui_translations_gin ON translations_ui USING GIN (translations);

-- GIN indexes on tsvector columns (full-text search)
CREATE INDEX idx_products_search_en ON products USING GIN (search_vector_en);
CREATE INDEX idx_products_search_bn ON products USING GIN (search_vector_bn);
CREATE INDEX idx_products_search_sv ON products USING GIN (search_vector_sv);

-- B-tree indexes on FK columns
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_categories_parent ON categories (parent_id);
CREATE INDEX idx_cart_items_session ON cart_items (session_id);
CREATE INDEX idx_clicks_session ON click_tracking (session_id);

-- Composite B-tree indexes for common queries
CREATE INDEX idx_products_active_featured ON products (is_active, is_featured);
CREATE INDEX idx_products_brand ON products (brand);
CREATE INDEX idx_product_images_product_sort ON product_images (product_id, sort_order);
CREATE INDEX idx_clicks_product_date ON click_tracking (product_id, clicked_at);
CREATE INDEX idx_price_history_product_date ON price_history (product_id, recorded_at);
CREATE INDEX idx_categories_active_sort ON categories (is_active, sort_order);
