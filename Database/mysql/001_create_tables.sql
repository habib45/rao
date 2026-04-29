-- =============================================================
-- 001_create_tables.sql
-- MySQL 8.0.16+ equivalent of Supabase migrations:
--   00001_create_tables.sql
--   00006_admin_rls.sql  (admin_settings + sync_logs table DDL)
--   00008_product_scheduling.sql  (publish_at column)
--   00009_product_workflow.sql    (product_status, rejection_reason, submitted_by)
--   00010_product_attributes.sql  (attributes column)
--
-- NOTE: Row Level Security (RLS) is a PostgreSQL/Supabase feature.
-- MySQL has no native RLS engine. The policies from 00003_enable_rls.sql
-- and 00006_admin_rls.sql must be enforced at the application layer:
--   - Active-only reads: add WHERE is_active = 1 in API queries
--   - Session-scoped cart: verify session_id in application middleware
--   - Admin-only access: check JWT app_metadata.role = 'admin' in API routes
-- =============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. categories
CREATE TABLE IF NOT EXISTS categories (
  id             CHAR(36)    NOT NULL DEFAULT (UUID()),
  amazon_node_id TEXT        NULL,
  name           JSON        NOT NULL,
  slug           JSON        NOT NULL,
  description    JSON        NOT NULL,
  parent_id      CHAR(36)    NULL,
  sort_order     INT         NOT NULL DEFAULT 0,
  image_url      TEXT        NULL,
  is_active      TINYINT(1)  NOT NULL DEFAULT 1,
  created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_amazon_node_id (amazon_node_id(255)),
  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. products
-- search_text_* GENERATED columns replace PostgreSQL TSVECTOR columns.
-- They recompute automatically on INSERT/UPDATE — no trigger needed.
-- publish_at, product_status, rejection_reason, submitted_by, attributes
-- are merged in from migrations 00008, 00009, 00010.
CREATE TABLE IF NOT EXISTS products (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
  asin                 VARCHAR(20)  NOT NULL,
  category_id          CHAR(36)     NULL,
  name                 JSON         NOT NULL,
  slug                 JSON         NOT NULL,
  description          JSON         NOT NULL,
  features             JSON         NOT NULL,
  meta_title           JSON         NOT NULL,
  meta_description     JSON         NOT NULL,
  price_cents          INT          NULL,
  original_price_cents INT          NULL,
  currency             VARCHAR(10)  NOT NULL DEFAULT 'USD',
  discount_pct         INT          NOT NULL DEFAULT 0,
  rating               DECIMAL(2,1) NULL,
  review_count         INT          NOT NULL DEFAULT 0,
  affiliate_url        TEXT         NOT NULL,
  brand                VARCHAR(255) NULL,
  availability         ENUM('in_stock','out_of_stock','unknown') NOT NULL DEFAULT 'unknown',
  is_featured          TINYINT(1)   NOT NULL DEFAULT 0,
  is_active            TINYINT(1)   NOT NULL DEFAULT 1,

  -- Full-text search generated columns (replace TSVECTOR columns).
  -- COALESCE(col->>'key','') maps to COALESCE(JSON_UNQUOTE(JSON_EXTRACT(col,'$.key')),'')
  -- Use FULLTEXT indexes in 002_create_indexes.sql for querying these.
  -- If your MySQL build raises ERROR 3106 on FULLTEXT on VIRTUAL, change to STORED.
  search_text_en TEXT GENERATED ALWAYS AS (
    CONCAT_WS(' ',
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(name,        '$.en')),   ''),
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.en')),   ''),
      COALESCE(brand, '')
    )
  ) VIRTUAL,

  search_text_bn TEXT GENERATED ALWAYS AS (
    CONCAT_WS(' ',
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(name,        '$."bn-BD"')), ''),
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$."bn-BD"')), '')
    )
  ) VIRTUAL,

  search_text_sv TEXT GENERATED ALWAYS AS (
    CONCAT_WS(' ',
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(name,        '$.sv')), ''),
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.sv')), '')
    )
  ) VIRTUAL,

  -- from 00008_product_scheduling.sql
  publish_at           DATETIME     NULL,

  -- from 00009_product_workflow.sql
  product_status       ENUM('draft','pending_review','approved','published') NOT NULL DEFAULT 'draft',
  rejection_reason     TEXT         NULL,
  submitted_by         VARCHAR(255) NULL,

  -- from 00010_product_attributes.sql
  attributes           JSON         NOT NULL DEFAULT (JSON_OBJECT()),

  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_products_asin (asin),
  CONSTRAINT chk_products_rating
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  CONSTRAINT chk_products_discount_pct
    CHECK (discount_pct >= 0 AND discount_pct <= 100),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. product_images
CREATE TABLE IF NOT EXISTS product_images (
  id         CHAR(36)   NOT NULL DEFAULT (UUID()),
  product_id CHAR(36)   NOT NULL,
  url        TEXT       NOT NULL,
  alt_text   JSON       NOT NULL,
  width      INT        NULL,
  height     INT        NULL,
  sort_order INT        NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. click_tracking
CREATE TABLE IF NOT EXISTS click_tracking (
  id         CHAR(36)                  NOT NULL DEFAULT (UUID()),
  product_id CHAR(36)                  NOT NULL,
  locale     ENUM('en','bn-BD','sv')   NOT NULL,
  session_id VARCHAR(255)              NOT NULL,
  referrer   TEXT                      NOT NULL DEFAULT '',
  user_agent TEXT                      NOT NULL DEFAULT '',
  ip_hash    VARCHAR(64)               NULL,
  clicked_at DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_click_tracking_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  session_id VARCHAR(255) NOT NULL,
  product_id CHAR(36)     NOT NULL,
  quantity   INT          NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_items_session_product (session_id, product_id),
  CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0),
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6. price_history
CREATE TABLE IF NOT EXISTS price_history (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  product_id  CHAR(36)    NOT NULL,
  price_cents INT         NOT NULL,
  currency    VARCHAR(10) NOT NULL DEFAULT 'USD',
  recorded_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_price_history_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 7. translations_ui
CREATE TABLE IF NOT EXISTS translations_ui (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  namespace    VARCHAR(100) NOT NULL,
  `key`        VARCHAR(255) NOT NULL,
  translations JSON         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_translations_ui_ns_key (namespace, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 8. admin_settings  (from 00006_admin_rls.sql)
-- TEXT cannot be a PRIMARY KEY in MySQL (no length limit).
-- Using VARCHAR(100) which covers all known key names.
CREATE TABLE IF NOT EXISTS admin_settings (
  `key`      VARCHAR(100) NOT NULL,
  value      JSON         NOT NULL DEFAULT (JSON_OBJECT()),
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 9. sync_logs  (from 00006_admin_rls.sql)
CREATE TABLE IF NOT EXISTS sync_logs (
  id              CHAR(36)    NOT NULL DEFAULT (UUID()),
  function_name   VARCHAR(100) NOT NULL,
  status          ENUM('success','partial','error') NOT NULL,
  items_processed INT         NOT NULL DEFAULT 0,
  errors          JSON        NOT NULL DEFAULT (JSON_ARRAY()),
  started_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME    NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
