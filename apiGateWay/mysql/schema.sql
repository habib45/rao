-- ============================================================
-- ORH / BestFinds — MySQL 8.0 Schema
-- Converted from Supabase PostgreSQL migrations
-- ============================================================

CREATE DATABASE IF NOT EXISTS orh_bestfinds
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE orh_bestfinds;

-- ============================================================
-- 1. categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  amazon_node_id VARCHAR(255) UNIQUE,
  name          JSON         NOT NULL DEFAULT ('{}'),
  slug          JSON         NOT NULL DEFAULT ('{}'),
  description   JSON         NOT NULL DEFAULT ('{}'),
  parent_id     VARCHAR(36)  NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  image_url     TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME(6)  NOT NULL DEFAULT NOW(6),
  updated_at    DATETIME(6)  NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
    REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent   ON categories (parent_id);
CREATE INDEX idx_categories_active   ON categories (is_active, sort_order);

-- ============================================================
-- 2. products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                    VARCHAR(36)    NOT NULL DEFAULT (UUID()),
  asin                  VARCHAR(20)    NOT NULL UNIQUE,
  category_id           VARCHAR(36)    NULL,
  name                  JSON           NOT NULL DEFAULT ('{}'),
  slug                  JSON           NOT NULL DEFAULT ('{}'),
  description           JSON           NOT NULL DEFAULT ('{}'),
  features              JSON           NOT NULL DEFAULT ('[]'),
  meta_title            JSON           NOT NULL DEFAULT ('{}'),
  meta_description      JSON           NOT NULL DEFAULT ('{}'),
  price_cents           INT            NULL,
  original_price_cents  INT            NULL,
  currency              VARCHAR(10)    NOT NULL DEFAULT 'USD',
  discount_pct          INT            NOT NULL DEFAULT 0,
  rating                DECIMAL(2,1)   NULL CHECK (rating >= 0 AND rating <= 5),
  review_count          INT            NOT NULL DEFAULT 0,
  affiliate_url         TEXT           NOT NULL,
  brand                 VARCHAR(255)   NULL,
  availability          ENUM('in_stock','out_of_stock','unknown') NOT NULL DEFAULT 'unknown',
  is_featured           BOOLEAN        NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN        NOT NULL DEFAULT TRUE,
  -- Phase 9: scheduled publishing
  publish_at            DATETIME(6)    NULL,
  -- Phase 11: workflow
  product_status        ENUM('draft','pending_review','approved','published') NOT NULL DEFAULT 'draft',
  rejection_reason      TEXT           NULL,
  submitted_by          VARCHAR(255)   NULL,
  -- Phase 10: flexible attributes
  attributes            JSON           NOT NULL DEFAULT ('{}'),
  -- Phase 20: comparison
  show_in_comparison    BOOLEAN        NOT NULL DEFAULT FALSE,
  -- Full-text search columns (denormalized from JSON)
  search_name_en        TEXT           AS (JSON_UNQUOTE(JSON_EXTRACT(name, '$.en')))          STORED,
  search_name_bn        TEXT           AS (JSON_UNQUOTE(JSON_EXTRACT(name, '$."bn-BD"')))     STORED,
  search_name_sv        TEXT           AS (JSON_UNQUOTE(JSON_EXTRACT(name, '$.sv')))          STORED,
  search_desc_en        TEXT           AS (JSON_UNQUOTE(JSON_EXTRACT(description, '$.en')))   STORED,
  created_at            DATETIME(6)    NOT NULL DEFAULT NOW(6),
  updated_at            DATETIME(6)    NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_products_category_id        ON products (category_id);
CREATE INDEX idx_products_active_featured    ON products (is_active, is_featured);
CREATE INDEX idx_products_brand              ON products (brand);
CREATE INDEX idx_products_status             ON products (product_status);
CREATE INDEX idx_products_publish_at         ON products (publish_at);
CREATE INDEX idx_products_show_in_comparison ON products (show_in_comparison);
-- Full-text search index
CREATE FULLTEXT INDEX ft_products_en ON products (search_name_en, search_desc_en, brand);
CREATE FULLTEXT INDEX ft_products_bn ON products (search_name_bn);
CREATE FULLTEXT INDEX ft_products_sv ON products (search_name_sv);

-- ============================================================
-- 3. product_images
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  product_id  VARCHAR(36)  NOT NULL,
  url         TEXT         NOT NULL,
  alt_text    JSON         NOT NULL DEFAULT ('{}'),
  width       INT          NULL,
  height      INT          NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  DATETIME(6)  NOT NULL DEFAULT NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_images_product_sort ON product_images (product_id, sort_order);

-- ============================================================
-- 4. click_tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS click_tracking (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  product_id  VARCHAR(36)  NOT NULL,
  locale      ENUM('en','bn-BD','sv') NOT NULL,
  session_id  VARCHAR(255) NOT NULL,
  referrer    VARCHAR(2048) NOT NULL DEFAULT '',
  user_agent  VARCHAR(1024) NOT NULL DEFAULT '',
  ip_hash     VARCHAR(255) NULL,
  clicked_at  DATETIME(6)  NOT NULL DEFAULT NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_click_tracking_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_clicks_session      ON click_tracking (session_id);
CREATE INDEX idx_clicks_product_date ON click_tracking (product_id, clicked_at);

-- ============================================================
-- 5. cart_items
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  session_id  VARCHAR(255) NOT NULL,
  product_id  VARCHAR(36)  NOT NULL,
  quantity    INT          NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  DATETIME(6)  NOT NULL DEFAULT NOW(6),
  updated_at  DATETIME(6)  NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_session_product (session_id, product_id),
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_cart_items_session ON cart_items (session_id);

-- ============================================================
-- 6. price_history
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  product_id  VARCHAR(36)  NOT NULL,
  price_cents INT          NOT NULL,
  currency    VARCHAR(10)  NOT NULL DEFAULT 'USD',
  recorded_at DATETIME(6)  NOT NULL DEFAULT NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_price_history_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_price_history_product_date ON price_history (product_id, recorded_at);

-- ============================================================
-- 7. translations_ui
-- ============================================================
CREATE TABLE IF NOT EXISTS translations_ui (
  id           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  namespace    VARCHAR(255) NOT NULL,
  `key`        VARCHAR(255) NOT NULL,
  translations JSON         NOT NULL DEFAULT ('{}'),
  created_at   DATETIME(6)  NOT NULL DEFAULT NOW(6),
  updated_at   DATETIME(6)  NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_translations_ns_key (namespace, `key`)
);

-- ============================================================
-- 8. admin_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  `key`      VARCHAR(255) NOT NULL,
  value      JSON         NOT NULL DEFAULT ('{}'),
  updated_at DATETIME(6)  NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (`key`)
);

-- Seed default settings
INSERT IGNORE INTO admin_settings (`key`, value) VALUES
  ('affiliate',  '{"default_tag":"bestfinds-20","tags":{"en":"bestfinds-20","bn-BD":"bestfinds-bd-20","sv":"bestfinds-sv-20"},"marketplace":"www.amazon.com"}'),
  ('sync',       '{"product_interval_hours":168,"price_interval_hours":24,"enabled":true}'),
  ('features',   '{"enable_cart":true,"enable_search":true,"enable_tracking":true}'),
  ('sitemap_exclusions', '{"slugs":[]}'),
  ('sitemap_cache_ttl',  '{"seconds":3600}'),
  ('robots_config','{"rules":[{"userAgent":"*","allow":["/"],"disallow":["/api/","/_next/","/admin/"]}]}'),
  ('newsletter_settings','{"show":true,"title":"Subscribe to our newsletter","subtitle":"Sign up to receive our latest news and products.","background":"indigo"}'),
  ('comparison','{"keys":["Color","Weight","Power Type","Battery Life","Cleaning Path","Accessories Included","Warranty","Dimensions","Material","Connectivity"]}');

-- ============================================================
-- 9. sync_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id               VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  function_name    VARCHAR(255) NOT NULL,
  status           ENUM('success','partial','error') NOT NULL,
  items_processed  INT          NOT NULL DEFAULT 0,
  errors           JSON         NOT NULL DEFAULT ('[]'),
  started_at       DATETIME(6)  NOT NULL DEFAULT NOW(6),
  completed_at     DATETIME(6)  NULL,
  PRIMARY KEY (id)
);

CREATE INDEX idx_sync_logs_started_at     ON sync_logs (started_at DESC);
CREATE INDEX idx_sync_logs_function_name  ON sync_logs (function_name);

-- ============================================================
-- 10. blog_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  name        JSON         NOT NULL DEFAULT ('{}'),
  slug        JSON         NOT NULL DEFAULT ('{}'),
  description JSON         NOT NULL DEFAULT ('{}'),
  color       VARCHAR(50)  NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  DATETIME(6)  NOT NULL DEFAULT NOW(6),
  updated_at  DATETIME(6)  NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id)
);

-- ============================================================
-- 11. blog_posts
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id                 VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  blog_category_id   VARCHAR(36)  NULL,
  title              JSON         NOT NULL DEFAULT ('{}'),
  slug               JSON         NOT NULL DEFAULT ('{}'),
  excerpt            JSON         NOT NULL DEFAULT ('{}'),
  content            LONGTEXT     NOT NULL,
  cover_image_url    TEXT         NULL,
  cover_image_alt    JSON         NOT NULL DEFAULT ('{}'),
  meta_title         JSON         NOT NULL DEFAULT ('{}'),
  meta_description   JSON         NOT NULL DEFAULT ('{}'),
  author_name        VARCHAR(255) NOT NULL DEFAULT 'BestFinds',
  author_avatar_url  TEXT         NULL,
  status             ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  is_featured        BOOLEAN      NOT NULL DEFAULT FALSE,
  view_count         INT          NOT NULL DEFAULT 0,
  read_time_minutes  INT          NOT NULL DEFAULT 0,
  published_at       DATETIME(6)  NULL,
  created_at         DATETIME(6)  NOT NULL DEFAULT NOW(6),
  updated_at         DATETIME(6)  NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_blog_posts_category FOREIGN KEY (blog_category_id)
    REFERENCES blog_categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_blog_posts_status       ON blog_posts (status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts (published_at DESC);
CREATE INDEX idx_blog_posts_category     ON blog_posts (blog_category_id);
CREATE INDEX idx_blog_posts_featured     ON blog_posts (is_featured);
CREATE INDEX idx_blog_posts_views        ON blog_posts (view_count DESC);
CREATE FULLTEXT INDEX ft_blog_posts_en   ON blog_posts (content);

-- ============================================================
-- 12. blog_tags
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_tags (
  id    VARCHAR(36) NOT NULL DEFAULT (UUID()),
  name  JSON        NOT NULL DEFAULT ('{}'),
  slug  JSON        NOT NULL DEFAULT ('{}'),
  PRIMARY KEY (id)
);

-- ============================================================
-- 13. blog_post_tags (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_post_tags (
  blog_post_id  VARCHAR(36) NOT NULL,
  blog_tag_id   VARCHAR(36) NOT NULL,
  PRIMARY KEY (blog_post_id, blog_tag_id),
  CONSTRAINT fk_bpt_post FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_bpt_tag  FOREIGN KEY (blog_tag_id)  REFERENCES blog_tags(id)  ON DELETE CASCADE
);

-- ============================================================
-- 14. blog_post_views
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_post_views (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  blog_post_id  VARCHAR(36)  NOT NULL,
  session_id    VARCHAR(255) NULL,
  locale        VARCHAR(20)  NULL,
  viewed_at     DATETIME(6)  NOT NULL DEFAULT NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_blog_views_post FOREIGN KEY (blog_post_id)
    REFERENCES blog_posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_blog_post_views_post ON blog_post_views (blog_post_id);

-- ============================================================
-- 15. blog_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_comments (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  blog_post_id  VARCHAR(36)   NOT NULL,
  author_name   VARCHAR(255)  NOT NULL,
  author_email  VARCHAR(255)  NOT NULL,
  body          TEXT          NOT NULL,
  is_approved   BOOLEAN       NOT NULL DEFAULT FALSE,
  parent_id     VARCHAR(36)   NULL,
  created_at    DATETIME(6)   NOT NULL DEFAULT NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_blog_comments_post   FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id)     ON DELETE CASCADE,
  CONSTRAINT fk_blog_comments_parent FOREIGN KEY (parent_id)    REFERENCES blog_comments(id)  ON DELETE CASCADE
);

CREATE INDEX idx_blog_comments_post     ON blog_comments (blog_post_id);
CREATE INDEX idx_blog_comments_approved ON blog_comments (is_approved);

-- ============================================================
-- 16. sitemap_custom_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS sitemap_custom_entries (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  url           TEXT          NOT NULL,
  priority      DECIMAL(2,1)  NOT NULL DEFAULT 0.5 CHECK (priority >= 0.1 AND priority <= 1.0),
  changefreq    ENUM('always','hourly','daily','weekly','monthly','yearly','never') NOT NULL DEFAULT 'weekly',
  last_modified DATETIME(6)   NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  notes         TEXT          NULL,
  created_at    DATETIME(6)   NOT NULL DEFAULT NOW(6),
  updated_at    DATETIME(6)   NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id)
);

CREATE INDEX idx_sitemap_custom_entries_active ON sitemap_custom_entries (is_active);

-- ============================================================
-- 17. newsletter_subscribers
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  email            VARCHAR(255)  NOT NULL UNIQUE,
  name             VARCHAR(255)  NULL,
  locale           VARCHAR(20)   NOT NULL DEFAULT 'en',
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  subscribed_at    DATETIME(6)   NOT NULL DEFAULT NOW(6),
  unsubscribed_at  DATETIME(6)   NULL,
  ip_hash          VARCHAR(255)  NULL,
  PRIMARY KEY (id)
);

CREATE INDEX idx_newsletter_email   ON newsletter_subscribers (email);
CREATE INDEX idx_newsletter_active  ON newsletter_subscribers (is_active);
CREATE INDEX idx_newsletter_subbed  ON newsletter_subscribers (subscribed_at DESC);
