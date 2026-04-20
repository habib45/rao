# Phase 2 — Test Matrix

## Summary

| Feature | Test Cases | Test File |
|---|---|---|
| F2.1 Core Tables | TC-2.1.1 – TC-2.1.18 | src/__tests__/schema.test.ts |
| F2.2 Indexes | TC-2.2.1 – TC-2.2.8 | src/__tests__/schema.test.ts |
| F2.3 RLS Policies | TC-2.3.1 – TC-2.3.7 | src/__tests__/schema.test.ts |
| F2.4 Triggers | TC-2.4.1 – TC-2.4.5 | src/__tests__/schema.test.ts |
| F2.5 Seed Data | TC-2.5.1 – TC-2.5.7 | src/__tests__/schema.test.ts |
| F2.6 Type Alignment | TC-2.6.1 – TC-2.6.5 | src/__tests__/schema.test.ts |
| **Total** | **50** | |

## Test Cases

### F2.1 Core Tables
| ID | Description |
|---|---|
| TC-2.1.1 | Migration file 00001_create_tables.sql exists |
| TC-2.1.2 | categories table has all required columns |
| TC-2.1.3 | products table has all required columns |
| TC-2.1.4 | product_images table has all required columns |
| TC-2.1.5 | click_tracking table has all required columns |
| TC-2.1.6 | cart_items table has all required columns |
| TC-2.1.7 | price_history table has all required columns |
| TC-2.1.8 | translations_ui table has all required columns |
| TC-2.1.9 | products.asin has UNIQUE constraint |
| TC-2.1.10 | products.rating has CHECK constraint (0-5) |
| TC-2.1.11 | products.availability has CHECK constraint |
| TC-2.1.12 | click_tracking.locale has CHECK constraint |
| TC-2.1.13 | cart_items.quantity has CHECK > 0 |
| TC-2.1.14 | cart_items has UNIQUE (session_id, product_id) |
| TC-2.1.15 | translations_ui has UNIQUE (namespace, key) |
| TC-2.1.16 | Foreign keys reference correct tables |
| TC-2.1.17 | ON DELETE CASCADE on product_images, click_tracking, cart_items, price_history |
| TC-2.1.18 | ON DELETE SET NULL on products.category_id and categories.parent_id |

### F2.2 Indexes
| ID | Description |
|---|---|
| TC-2.2.1 | GIN indexes exist for all JSONB columns |
| TC-2.2.2 | GIN indexes exist for tsvector columns |
| TC-2.2.3 | B-tree indexes on FK columns |
| TC-2.2.4 | Composite index on products(is_active, is_featured) |
| TC-2.2.5 | Composite index on product_images(product_id, sort_order) |
| TC-2.2.6 | Composite index on click_tracking(product_id, clicked_at) |
| TC-2.2.7 | Composite index on price_history(product_id, recorded_at) |
| TC-2.2.8 | Index naming follows convention |

### F2.3 RLS Policies
| ID | Description |
|---|---|
| TC-2.3.1 | RLS enabled on all 7 tables |
| TC-2.3.2 | categories has SELECT policy for active rows |
| TC-2.3.3 | products has SELECT policy for active rows |
| TC-2.3.4 | click_tracking has INSERT policy |
| TC-2.3.5 | cart_items has SELECT/INSERT/UPDATE/DELETE policies |
| TC-2.3.6 | product_images has SELECT policy |
| TC-2.3.7 | price_history and translations_ui have SELECT policies |

### F2.4 Triggers
| ID | Description |
|---|---|
| TC-2.4.1 | set_updated_at() function defined |
| TC-2.4.2 | update_product_search_vectors() function defined |
| TC-2.4.3 | updated_at triggers on categories, products, cart_items, translations_ui |
| TC-2.4.4 | Search vector trigger on products |
| TC-2.4.5 | Triggers fire BEFORE UPDATE/INSERT |

### F2.5 Seed Data
| ID | Description |
|---|---|
| TC-2.5.1 | Seed file exists |
| TC-2.5.2 | Seed inserts into all 7 tables |
| TC-2.5.3 | At least 4 categories seeded |
| TC-2.5.4 | At least 6 products seeded |
| TC-2.5.5 | Seed has multi-locale translations |
| TC-2.5.6 | Seed covers edge cases (null price, inactive, featured) |
| TC-2.5.7 | Seed is idempotent (ON CONFLICT) |

### F2.6 Type Alignment
| ID | Description |
|---|---|
| TC-2.6.1 | Every Product interface field has a corresponding column |
| TC-2.6.2 | Every Category interface field has a corresponding column |
| TC-2.6.3 | Every ProductImage interface field has a corresponding column |
| TC-2.6.4 | Every ClickEvent interface field has a corresponding column |
| TC-2.6.5 | Every PriceHistoryEntry interface field has a corresponding column |
