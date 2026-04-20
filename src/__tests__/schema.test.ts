import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const migrationsDir = path.resolve(__dirname, "../../supabase/migrations");

function readMigration(filename: string): string {
  return fs.readFileSync(path.join(migrationsDir, filename), "utf-8");
}

// Helper: check SQL contains a CREATE TABLE with specific columns
function expectTableColumns(sql: string, table: string, columns: string[]) {
  // Find the CREATE TABLE block
  const tableRegex = new RegExp(
    `CREATE TABLE\\s+(?:public\\.)?${table}\\s*\\(([^;]+)\\)`,
    "is"
  );
  const match = sql.match(tableRegex);
  expect(match).not.toBeNull();
  const body = match![1];
  for (const col of columns) {
    expect(body.toLowerCase()).toContain(col.toLowerCase());
  }
}

// Helper: check SQL contains a pattern
function expectContains(sql: string, pattern: string) {
  expect(sql.toLowerCase()).toContain(pattern.toLowerCase());
}

// ============================================================
// F2.1: Core Tables
// ============================================================
describe("F2.1: Core Tables Migration", () => {
  // TC-2.1.1
  it("migration file 00001_create_tables.sql exists", () => {
    expect(
      fs.existsSync(path.join(migrationsDir, "00001_create_tables.sql"))
    ).toBe(true);
  });

  let sql: string;

  // Load the migration SQL (will fail gracefully if file doesn't exist)
  try {
    sql = readMigration("00001_create_tables.sql");
  } catch {
    sql = "";
  }

  // TC-2.1.2
  it("categories table has all required columns", () => {
    expectTableColumns(sql, "categories", [
      "id",
      "amazon_node_id",
      "name",
      "slug",
      "description",
      "parent_id",
      "sort_order",
      "image_url",
      "is_active",
      "created_at",
      "updated_at",
    ]);
  });

  // TC-2.1.3
  it("products table has all required columns", () => {
    expectTableColumns(sql, "products", [
      "id",
      "asin",
      "category_id",
      "name",
      "slug",
      "description",
      "features",
      "meta_title",
      "meta_description",
      "price_cents",
      "original_price_cents",
      "currency",
      "discount_pct",
      "rating",
      "review_count",
      "affiliate_url",
      "brand",
      "availability",
      "is_featured",
      "is_active",
      "search_vector_en",
      "search_vector_bn",
      "search_vector_sv",
      "created_at",
      "updated_at",
    ]);
  });

  // TC-2.1.4
  it("product_images table has all required columns", () => {
    expectTableColumns(sql, "product_images", [
      "id",
      "product_id",
      "url",
      "alt_text",
      "width",
      "height",
      "sort_order",
      "is_primary",
      "created_at",
    ]);
  });

  // TC-2.1.5
  it("click_tracking table has all required columns", () => {
    expectTableColumns(sql, "click_tracking", [
      "id",
      "product_id",
      "locale",
      "session_id",
      "referrer",
      "user_agent",
      "ip_hash",
      "clicked_at",
    ]);
  });

  // TC-2.1.6
  it("cart_items table has all required columns", () => {
    expectTableColumns(sql, "cart_items", [
      "id",
      "session_id",
      "product_id",
      "quantity",
      "created_at",
      "updated_at",
    ]);
  });

  // TC-2.1.7
  it("price_history table has all required columns", () => {
    expectTableColumns(sql, "price_history", [
      "id",
      "product_id",
      "price_cents",
      "currency",
      "recorded_at",
    ]);
  });

  // TC-2.1.8
  it("translations_ui table has all required columns", () => {
    expectTableColumns(sql, "translations_ui", [
      "id",
      "namespace",
      "key",
      "translations",
      "created_at",
      "updated_at",
    ]);
  });

  // TC-2.1.9
  it("products.asin has UNIQUE constraint", () => {
    expectContains(sql, "unique");
    // Check asin is marked unique in the products table context
    const productsBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?products\s*\(([^;]+)\)/is
    );
    expect(productsBlock).not.toBeNull();
    expect(productsBlock![1].toLowerCase()).toMatch(/asin\s+text\s+not null\s+unique/);
  });

  // TC-2.1.10
  it("products.rating has CHECK constraint (0-5)", () => {
    const productsBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?products\s*\(([^;]+)\)/is
    );
    expect(productsBlock).not.toBeNull();
    const body = productsBlock![1].toLowerCase();
    expect(body).toMatch(/rating.*check\s*\(/);
    expect(body).toContain("0");
    expect(body).toContain("5");
  });

  // TC-2.1.11
  it("products.availability has CHECK constraint", () => {
    const productsBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?products\s*\(([^;]+)\)/is
    );
    expect(productsBlock).not.toBeNull();
    const body = productsBlock![1].toLowerCase();
    expect(body).toContain("in_stock");
    expect(body).toContain("out_of_stock");
    expect(body).toContain("unknown");
  });

  // TC-2.1.12
  it("click_tracking.locale has CHECK constraint", () => {
    const clickBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?click_tracking\s*\(([^;]+)\)/is
    );
    expect(clickBlock).not.toBeNull();
    const body = clickBlock![1].toLowerCase();
    expect(body).toContain("en");
    expect(body).toContain("bn-bd");
    expect(body).toContain("sv");
  });

  // TC-2.1.13
  it("cart_items.quantity has CHECK > 0", () => {
    const cartBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?cart_items\s*\(([^;]+)\)/is
    );
    expect(cartBlock).not.toBeNull();
    const body = cartBlock![1].toLowerCase();
    expect(body).toMatch(/quantity.*check/);
    expect(body).toContain("> 0");
  });

  // TC-2.1.14
  it("cart_items has UNIQUE (session_id, product_id)", () => {
    const cartBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?cart_items\s*\(([^;]+)\)/is
    );
    expect(cartBlock).not.toBeNull();
    const body = cartBlock![1].toLowerCase();
    expect(body).toMatch(/unique\s*\(\s*session_id\s*,\s*product_id\s*\)/);
  });

  // TC-2.1.15
  it("translations_ui has UNIQUE (namespace, key)", () => {
    const transBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?translations_ui\s*\(([^;]+)\)/is
    );
    expect(transBlock).not.toBeNull();
    const body = transBlock![1].toLowerCase();
    expect(body).toMatch(/unique\s*\(\s*namespace\s*,\s*key\s*\)/);
  });

  // TC-2.1.16
  it("foreign keys reference correct tables", () => {
    expectContains(sql, "REFERENCES categories(id)");
    expectContains(sql, "REFERENCES products(id)");
  });

  // TC-2.1.17
  it("ON DELETE CASCADE on product_images, click_tracking, cart_items, price_history", () => {
    // Each of these tables' product_id FK should cascade
    for (const table of [
      "product_images",
      "click_tracking",
      "cart_items",
      "price_history",
    ]) {
      const block = sql.match(
        new RegExp(
          `CREATE TABLE\\s+(?:public\\.)?${table}\\s*\\(([^;]+)\\)`,
          "is"
        )
      );
      expect(block).not.toBeNull();
      expect(block![1].toLowerCase()).toContain("on delete cascade");
    }
  });

  // TC-2.1.18
  it("ON DELETE SET NULL on products.category_id and categories.parent_id", () => {
    // products.category_id
    const productsBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?products\s*\(([^;]+)\)/is
    );
    expect(productsBlock).not.toBeNull();
    expect(productsBlock![1].toLowerCase()).toContain("on delete set null");

    // categories.parent_id
    const catBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?categories\s*\(([^;]+)\)/is
    );
    expect(catBlock).not.toBeNull();
    expect(catBlock![1].toLowerCase()).toContain("on delete set null");
  });
});

// ============================================================
// F2.2: Indexes
// ============================================================
describe("F2.2: Indexes", () => {
  let sql: string;
  try {
    sql = readMigration("00002_create_indexes.sql");
  } catch {
    sql = "";
  }

  // TC-2.2.1
  it("migration file 00002_create_indexes.sql exists", () => {
    expect(
      fs.existsSync(path.join(migrationsDir, "00002_create_indexes.sql"))
    ).toBe(true);
  });

  // TC-2.2.1 (continued)
  it("GIN indexes exist for all JSONB columns", () => {
    const expectedGinIndexes = [
      "idx_categories_name_gin",
      "idx_categories_slug_gin",
      "idx_products_name_gin",
      "idx_products_slug_gin",
      "idx_products_description_gin",
      "idx_product_images_alt_text_gin",
      "idx_translations_ui_translations_gin",
    ];
    for (const idx of expectedGinIndexes) {
      expectContains(sql, idx);
    }
  });

  // TC-2.2.2
  it("GIN indexes exist for tsvector columns", () => {
    expectContains(sql, "idx_products_search_en");
    expectContains(sql, "idx_products_search_bn");
    expectContains(sql, "idx_products_search_sv");
  });

  // TC-2.2.3
  it("B-tree indexes on FK and query columns", () => {
    expectContains(sql, "idx_products_category_id");
    expectContains(sql, "idx_categories_parent");
    expectContains(sql, "idx_cart_items_session");
    expectContains(sql, "idx_clicks_session");
  });

  // TC-2.2.4
  it("composite index on products(is_active, is_featured)", () => {
    expectContains(sql, "idx_products_active_featured");
    // Verify it references both columns
    const line = sql
      .split("\n")
      .find((l) => l.toLowerCase().includes("idx_products_active_featured"));
    expect(line).toBeDefined();
    expect(line!.toLowerCase()).toContain("is_active");
    expect(line!.toLowerCase()).toContain("is_featured");
  });

  // TC-2.2.5
  it("composite index on product_images(product_id, sort_order)", () => {
    expectContains(sql, "idx_product_images_product_sort");
  });

  // TC-2.2.6
  it("composite index on click_tracking(product_id, clicked_at)", () => {
    expectContains(sql, "idx_clicks_product_date");
  });

  // TC-2.2.7
  it("composite index on price_history(product_id, recorded_at)", () => {
    expectContains(sql, "idx_price_history_product_date");
  });

  // TC-2.2.8
  it("index naming follows idx_ convention", () => {
    const indexNames = sql.match(/CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi);
    expect(indexNames).not.toBeNull();
    for (const match of indexNames!) {
      const name = match.replace(/CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?/i, "");
      expect(name).toMatch(/^idx_/);
    }
  });
});

// ============================================================
// F2.3: RLS Policies
// ============================================================
describe("F2.3: RLS Policies", () => {
  let sql: string;
  try {
    sql = readMigration("00003_enable_rls.sql");
  } catch {
    sql = "";
  }

  // TC-2.3.1
  it("RLS enabled on all 7 tables", () => {
    expect(
      fs.existsSync(path.join(migrationsDir, "00003_enable_rls.sql"))
    ).toBe(true);

    const tables = [
      "categories",
      "products",
      "product_images",
      "click_tracking",
      "cart_items",
      "price_history",
      "translations_ui",
    ];
    for (const table of tables) {
      expect(sql.toLowerCase()).toContain(
        `alter table ${table} enable row level security`.toLowerCase()
      );
    }
  });

  // TC-2.3.2
  it("categories has SELECT policy for active rows", () => {
    expectContains(sql, "categories_select_active");
    expectContains(sql, "is_active");
  });

  // TC-2.3.3
  it("products has SELECT policy for active rows", () => {
    expectContains(sql, "products_select_active");
  });

  // TC-2.3.4
  it("click_tracking has INSERT policy", () => {
    expectContains(sql, "clicks_insert_own");
  });

  // TC-2.3.5
  it("cart_items has SELECT/INSERT/UPDATE/DELETE policies", () => {
    expectContains(sql, "cart_select_own");
    expectContains(sql, "cart_insert_own");
    expectContains(sql, "cart_update_own");
    expectContains(sql, "cart_delete_own");
  });

  // TC-2.3.6
  it("product_images has SELECT policy", () => {
    expectContains(sql, "product_images_select_all");
  });

  // TC-2.3.7
  it("price_history and translations_ui have SELECT policies", () => {
    expectContains(sql, "price_history_select_all");
    expectContains(sql, "translations_select_all");
  });
});

// ============================================================
// F2.4: Triggers
// ============================================================
describe("F2.4: Triggers & Functions", () => {
  let sql: string;
  try {
    sql = readMigration("00004_create_triggers.sql");
  } catch {
    sql = "";
  }

  // TC-2.4.1
  it("set_updated_at() function defined", () => {
    expect(
      fs.existsSync(path.join(migrationsDir, "00004_create_triggers.sql"))
    ).toBe(true);
    expectContains(sql, "set_updated_at");
    expectContains(sql, "NEW.updated_at");
  });

  // TC-2.4.2
  it("update_product_search_vectors() function defined", () => {
    expectContains(sql, "update_product_search_vectors");
    expectContains(sql, "search_vector_en");
    expectContains(sql, "to_tsvector");
  });

  // TC-2.4.3
  it("updated_at triggers on categories, products, cart_items, translations_ui", () => {
    expectContains(sql, "trg_categories_updated_at");
    expectContains(sql, "trg_products_updated_at");
    expectContains(sql, "trg_cart_items_updated_at");
    expectContains(sql, "trg_translations_ui_updated_at");
  });

  // TC-2.4.4
  it("search vector trigger on products", () => {
    expectContains(sql, "trg_products_search_vectors");
  });

  // TC-2.4.5
  it("triggers fire BEFORE UPDATE/INSERT", () => {
    // updated_at triggers should be BEFORE UPDATE
    expect(sql.toLowerCase()).toMatch(/before\s+update\s+on\s+categories/);
    expect(sql.toLowerCase()).toMatch(/before\s+update\s+on\s+products/);
    // search vector trigger should be BEFORE INSERT OR UPDATE
    expect(sql.toLowerCase()).toMatch(
      /before\s+insert\s+or\s+update\s+on\s+products/
    );
  });
});

// ============================================================
// F2.5: Seed Data
// ============================================================
describe("F2.5: Seed Data", () => {
  let sql: string;
  try {
    sql = readMigration("00005_seed_data.sql");
  } catch {
    sql = "";
  }

  // TC-2.5.1
  it("seed file exists", () => {
    expect(
      fs.existsSync(path.join(migrationsDir, "00005_seed_data.sql"))
    ).toBe(true);
  });

  // TC-2.5.2
  it("seed inserts into all 7 tables", () => {
    const tables = [
      "categories",
      "products",
      "product_images",
      "click_tracking",
      "cart_items",
      "price_history",
      "translations_ui",
    ];
    for (const table of tables) {
      expectContains(sql, `INSERT INTO ${table}`);
    }
  });

  // TC-2.5.3
  it("at least 4 categories seeded", () => {
    const catInserts = sql.match(
      /INSERT INTO\s+categories[\s\S]*?VALUES[\s\S]*?;/gi
    );
    expect(catInserts).not.toBeNull();
    // Count value tuples (each starts with a parenthesis containing a uuid or gen_random_uuid)
    const fullCatSql = catInserts!.join(" ");
    const tuples = fullCatSql.match(/\(\s*'[0-9a-f-]+'/gi);
    expect(tuples).not.toBeNull();
    expect(tuples!.length).toBeGreaterThanOrEqual(4);
  });

  // TC-2.5.4
  it("at least 6 products seeded", () => {
    const prodInserts = sql.match(
      /INSERT INTO\s+products[\s\S]*?VALUES[\s\S]*?;/gi
    );
    expect(prodInserts).not.toBeNull();
    const fullProdSql = prodInserts!.join(" ");
    const tuples = fullProdSql.match(/\(\s*'[0-9a-f-]+'/gi);
    expect(tuples).not.toBeNull();
    expect(tuples!.length).toBeGreaterThanOrEqual(6);
  });

  // TC-2.5.5
  it("seed has multi-locale translations", () => {
    expectContains(sql, '"en"');
    expectContains(sql, '"bn-BD"');
    expectContains(sql, '"sv"');
  });

  // TC-2.5.6
  it("seed covers edge cases (null price, inactive, featured)", () => {
    // null price
    expectContains(sql, "NULL");
    // inactive product
    expectContains(sql, "false");
    // featured product
    const prodSection = sql
      .split(/INSERT INTO\s+products/i)
      .slice(1)
      .join("");
    expect(prodSection.toLowerCase()).toContain("true");
  });

  // TC-2.5.7
  it("seed is idempotent (ON CONFLICT)", () => {
    expectContains(sql, "ON CONFLICT");
  });
});

// ============================================================
// F2.6: Type Alignment
// ============================================================
describe("F2.6: Type Alignment", () => {
  let sql: string;
  try {
    sql = readMigration("00001_create_tables.sql");
  } catch {
    sql = "";
  }

  // TC-2.6.1
  it("every Product interface field has a corresponding column", () => {
    const productFields = [
      "id",
      "asin",
      "category_id",
      "name",
      "slug",
      "description",
      "features",
      "meta_title",
      "meta_description",
      "price_cents",
      "original_price_cents",
      "currency",
      "discount_pct",
      "rating",
      "review_count",
      "affiliate_url",
      "brand",
      "availability",
      "is_featured",
      "is_active",
      "created_at",
      "updated_at",
    ];
    const productsBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?products\s*\(([^;]+)\)/is
    );
    expect(productsBlock).not.toBeNull();
    const body = productsBlock![1].toLowerCase();
    for (const field of productFields) {
      expect(body).toContain(field.toLowerCase());
    }
  });

  // TC-2.6.2
  it("every Category interface field has a corresponding column", () => {
    const categoryFields = [
      "id",
      "amazon_node_id",
      "name",
      "slug",
      "description",
      "parent_id",
      "sort_order",
      "image_url",
      "is_active",
    ];
    const catBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?categories\s*\(([^;]+)\)/is
    );
    expect(catBlock).not.toBeNull();
    const body = catBlock![1].toLowerCase();
    for (const field of categoryFields) {
      expect(body).toContain(field.toLowerCase());
    }
  });

  // TC-2.6.3
  it("every ProductImage interface field has a corresponding column", () => {
    const imageFields = [
      "id",
      "url",
      "alt_text",
      "width",
      "height",
      "sort_order",
      "is_primary",
    ];
    const imgBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?product_images\s*\(([^;]+)\)/is
    );
    expect(imgBlock).not.toBeNull();
    const body = imgBlock![1].toLowerCase();
    for (const field of imageFields) {
      expect(body).toContain(field.toLowerCase());
    }
  });

  // TC-2.6.4
  it("every ClickEvent interface field has a corresponding column", () => {
    const clickFields = [
      "product_id",
      "locale",
      "session_id",
      "referrer",
      "user_agent",
    ];
    const clickBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?click_tracking\s*\(([^;]+)\)/is
    );
    expect(clickBlock).not.toBeNull();
    const body = clickBlock![1].toLowerCase();
    for (const field of clickFields) {
      expect(body).toContain(field.toLowerCase());
    }
  });

  // TC-2.6.5
  it("every PriceHistoryEntry interface field has a corresponding column", () => {
    const priceFields = ["id", "product_id", "price_cents", "currency", "recorded_at"];
    const priceBlock = sql.match(
      /CREATE TABLE\s+(?:public\.)?price_history\s*\(([^;]+)\)/is
    );
    expect(priceBlock).not.toBeNull();
    const body = priceBlock![1].toLowerCase();
    for (const field of priceFields) {
      expect(body).toContain(field.toLowerCase());
    }
  });
});
