-- =============================================================
-- 002_create_indexes.sql
-- MySQL 8.0+ equivalent of Supabase migrations:
--   00002_create_indexes.sql
--   00006_admin_rls.sql     (sync_logs indexes)
--   00008_product_scheduling.sql  (publish_at index)
--   00009_product_workflow.sql    (product_status index)
--   00010_product_attributes.sql  (attributes GIN → virtual col index)
--
-- JSONB GIN indexes strategy:
--   Add a VIRTUAL VARCHAR column extracting the 'en' key from each
--   multilingual JSON column, then create a B-tree index on that column.
--   This enables efficient WHERE name_en LIKE 'Headph%' or ORDER BY slug_en.
--
-- TSVECTOR GIN indexes strategy:
--   FULLTEXT indexes on the search_text_* GENERATED columns defined in 001.
--   Query with: MATCH(search_text_en) AGAINST ('headphone' IN BOOLEAN MODE)
--
-- Partial index note (00008):
--   MySQL does not support WHERE-clause partial indexes.
--   The original: CREATE INDEX ... WHERE publish_at IS NOT NULL AND is_active = FALSE
--   is replaced by a composite index on (publish_at, is_active).
--
-- FULLTEXT on VIRTUAL columns note:
--   Most MySQL 8.0.13+ builds support FULLTEXT on VIRTUAL TEXT columns.
--   If you hit ERROR 3106 ("Feature is not supported for generated columns"),
--   edit 001_create_tables.sql and change the three search_text_* columns
--   from VIRTUAL to STORED, then re-run both files.
-- =============================================================

-- ---------------------------------------------------------------
-- categories: virtual index columns for JSON name and slug
-- ---------------------------------------------------------------
ALTER TABLE categories
  ADD COLUMN name_en VARCHAR(500) GENERATED ALWAYS AS
    (JSON_UNQUOTE(JSON_EXTRACT(name, '$.en'))) VIRTUAL,
  ADD COLUMN slug_en VARCHAR(500) GENERATED ALWAYS AS
    (JSON_UNQUOTE(JSON_EXTRACT(slug, '$.en'))) VIRTUAL;

CREATE INDEX idx_categories_name_en ON categories (name_en(191));
CREATE INDEX idx_categories_slug_en ON categories (slug_en(191));

-- ---------------------------------------------------------------
-- products: virtual index columns for JSON name and slug
-- ---------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN name_en VARCHAR(500) GENERATED ALWAYS AS
    (JSON_UNQUOTE(JSON_EXTRACT(name, '$.en'))) VIRTUAL,
  ADD COLUMN slug_en VARCHAR(500) GENERATED ALWAYS AS
    (JSON_UNQUOTE(JSON_EXTRACT(slug, '$.en'))) VIRTUAL;

CREATE INDEX idx_products_name_en ON products (name_en(191));
CREATE INDEX idx_products_slug_en ON products (slug_en(191));

-- products: virtual index column for attributes.brand (most common attribute lookup)
-- For arbitrary JSON path queries on attributes, use JSON_EXTRACT() in WHERE clauses;
-- those cannot be pre-indexed generically.
ALTER TABLE products
  ADD COLUMN attributes_brand VARCHAR(255) GENERATED ALWAYS AS
    (JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.brand'))) VIRTUAL;

CREATE INDEX idx_products_attributes_brand ON products (attributes_brand(191));

-- ---------------------------------------------------------------
-- FULLTEXT indexes on GENERATED search_text_* columns
-- Replaces GIN indexes on TSVECTOR columns from PostgreSQL
-- ---------------------------------------------------------------
CREATE FULLTEXT INDEX ft_products_search_en ON products (search_text_en);
CREATE FULLTEXT INDEX ft_products_search_bn ON products (search_text_bn);
CREATE FULLTEXT INDEX ft_products_search_sv ON products (search_text_sv);

-- ---------------------------------------------------------------
-- B-tree indexes on foreign key columns
-- ---------------------------------------------------------------
CREATE INDEX idx_products_category_id        ON products       (category_id);
CREATE INDEX idx_categories_parent           ON categories     (parent_id);
CREATE INDEX idx_cart_items_session          ON cart_items     (session_id);
CREATE INDEX idx_clicks_session              ON click_tracking (session_id);

-- ---------------------------------------------------------------
-- Composite B-tree indexes
-- ---------------------------------------------------------------
CREATE INDEX idx_products_active_featured    ON products       (is_active, is_featured);
CREATE INDEX idx_products_brand              ON products       (brand);
CREATE INDEX idx_product_images_product_sort ON product_images (product_id, sort_order);
CREATE INDEX idx_clicks_product_date         ON click_tracking (product_id, clicked_at);
CREATE INDEX idx_price_history_product_date  ON price_history  (product_id, recorded_at);
CREATE INDEX idx_categories_active_sort      ON categories     (is_active, sort_order);

-- ---------------------------------------------------------------
-- Indexes from later migrations
-- ---------------------------------------------------------------

-- From 00006_admin_rls.sql
CREATE INDEX idx_sync_logs_started_at    ON sync_logs (started_at DESC);
CREATE INDEX idx_sync_logs_function_name ON sync_logs (function_name);

-- From 00008: composite replaces the partial index (MySQL has no WHERE-clause indexes)
CREATE INDEX idx_products_publish_at_active ON products (publish_at, is_active);

-- From 00009
CREATE INDEX idx_products_status ON products (product_status);
