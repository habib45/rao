-- =============================================================
-- 012_product_faqs.sql
-- Add product_faqs table for FAQ Schema implementation
-- =============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- product_faqs table
CREATE TABLE IF NOT EXISTS product_faqs (
  id          CHAR(36)    NOT NULL DEFAULT (UUID()),
  product_id  CHAR(36)    NOT NULL,
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  locale      VARCHAR(10) NOT NULL DEFAULT 'en',
  sort_order  INT         NOT NULL DEFAULT 0,
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_product_faqs_product_id (product_id),
  INDEX idx_product_faqs_locale (locale),
  INDEX idx_product_faqs_is_active (is_active),
  CONSTRAINT fk_product_faqs_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed sample FAQs for testing
INSERT INTO product_faqs (product_id, question, answer, locale, sort_order)
SELECT 
  id,
  'Is this product available on Amazon?',
  'Yes, this product is available on Amazon. Click the "Buy on Amazon" button to purchase.',
  'en',
  1
FROM products
LIMIT 5;
