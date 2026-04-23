import { describe, it, expect } from "vitest";
import { categorySchema } from "../schemas/category";
import { productUpdateSchema } from "../schemas/product";
import { translationUpdateSchema } from "../schemas/translation";

// ─── categorySchema ──────────────────────────────────────────────────────────

const validCategory = {
  name: { en: "Electronics", "bn-BD": "ইলেকট্রনিক্স", sv: "Elektronik" },
  slug: { en: "electronics", "bn-BD": "electronics", sv: "elektronik" },
  description: { en: "All electronics", "bn-BD": "", sv: "" },
  amazon_node_id: "172282",
  parent_id: null,
  sort_order: 1,
  image_url: "https://example.com/img.jpg",
  is_active: true,
};

describe("categorySchema", () => {
  it("accepts a fully populated valid object", () => {
    const result = categorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  it("accepts minimal object (only en fields) and applies defaults", () => {
    const result = categorySchema.safeParse({
      name: { en: "Books" },
      slug: { en: "books" },
      description: { en: "All books" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(0);
      expect(result.data.is_active).toBe(true);
      expect(result.data.parent_id).toBeNull();
      expect(result.data.image_url).toBeNull();
    }
  });

  it("rejects when name.en is missing", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      name: { "bn-BD": "টেস্ট", sv: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects when name.en is empty string", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      name: { en: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID parent_id", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      parent_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid UUID parent_id", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      parent_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("transforms empty image_url string to null", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      image_url: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image_url).toBeNull();
    }
  });

  it("accepts null image_url", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      image_url: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid image_url (not a URL and not empty)", () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      image_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("sort_order defaults to 0 when omitted", () => {
    const { sort_order: _so, ...rest } = validCategory;
    void _so;
    const result = categorySchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(0);
    }
  });

  it("is_active defaults to true when omitted", () => {
    const { is_active: _ia, ...rest } = validCategory;
    void _ia;
    const result = categorySchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
    }
  });
});

// ─── productUpdateSchema ──────────────────────────────────────────────────────

const validProduct = {
  name: { en: "Laptop", "bn-BD": "ল্যাপটপ", sv: "Bärbar dator" },
  slug: { en: "laptop", "bn-BD": "laptop", sv: "laptop" },
  description: { en: "A great laptop", "bn-BD": "", sv: "" },
  meta_title: { en: "Buy Laptop", "bn-BD": "", sv: "" },
  meta_description: { en: "Best laptop deals", "bn-BD": "", sv: "" },
  features: ["Fast processor", "Long battery"],
  price_cents: 99999,
  original_price_cents: 119999,
  currency: "USD",
  discount_pct: 17,
  category_id: "550e8400-e29b-41d4-a716-446655440000",
  brand: "Dell",
  availability: "in_stock",
  is_featured: false,
  is_active: true,
};

describe("productUpdateSchema", () => {
  it("accepts a fully populated valid object", () => {
    const result = productUpdateSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("rejects when name.en is missing", () => {
    const result = productUpdateSchema.safeParse({
      ...validProduct,
      name: { "bn-BD": "test", sv: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid availability value", () => {
    const result = productUpdateSchema.safeParse({
      ...validProduct,
      availability: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid availability values", () => {
    for (const val of ["in_stock", "out_of_stock", "unknown"]) {
      const result = productUpdateSchema.safeParse({
        ...validProduct,
        availability: val,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects discount_pct above 100", () => {
    const result = productUpdateSchema.safeParse({
      ...validProduct,
      discount_pct: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects discount_pct below 0", () => {
    const result = productUpdateSchema.safeParse({
      ...validProduct,
      discount_pct: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts discount_pct at boundaries (0 and 100)", () => {
    expect(productUpdateSchema.safeParse({ ...validProduct, discount_pct: 0 }).success).toBe(true);
    expect(productUpdateSchema.safeParse({ ...validProduct, discount_pct: 100 }).success).toBe(true);
  });

  it("accepts null price_cents", () => {
    const result = productUpdateSchema.safeParse({
      ...validProduct,
      price_cents: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null category_id", () => {
    const result = productUpdateSchema.safeParse({
      ...validProduct,
      category_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("defaults currency to USD when omitted", () => {
    const { currency: _cur, ...rest } = validProduct;
    void _cur;
    const result = productUpdateSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });
});

// ─── translationUpdateSchema ──────────────────────────────────────────────────

describe("translationUpdateSchema", () => {
  it("accepts a valid updates array", () => {
    const result = translationUpdateSchema.safeParse({
      updates: [
        {
          table: "products",
          id: "550e8400-e29b-41d4-a716-446655440000",
          field: "name",
          locale: "sv",
          value: "Laptop",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty updates array", () => {
    const result = translationUpdateSchema.safeParse({ updates: [] });
    expect(result.success).toBe(true);
  });

  it("rejects invalid table value", () => {
    const result = translationUpdateSchema.safeParse({
      updates: [
        {
          table: "users",
          id: "550e8400-e29b-41d4-a716-446655440000",
          field: "name",
          locale: "en",
          value: "Test",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid locale value", () => {
    const result = translationUpdateSchema.safeParse({
      updates: [
        {
          table: "products",
          id: "550e8400-e29b-41d4-a716-446655440000",
          field: "name",
          locale: "de",
          value: "Test",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID id", () => {
    const result = translationUpdateSchema.safeParse({
      updates: [
        {
          table: "products",
          id: "not-a-uuid",
          field: "name",
          locale: "en",
          value: "Test",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts both products and categories as table values", () => {
    for (const table of ["products", "categories"]) {
      const result = translationUpdateSchema.safeParse({
        updates: [
          {
            table,
            id: "550e8400-e29b-41d4-a716-446655440000",
            field: "name",
            locale: "en",
            value: "Test",
          },
        ],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid locale values", () => {
    for (const locale of ["en", "bn-BD", "sv"]) {
      const result = translationUpdateSchema.safeParse({
        updates: [
          {
            table: "categories",
            id: "550e8400-e29b-41d4-a716-446655440000",
            field: "name",
            locale,
            value: "Test",
          },
        ],
      });
      expect(result.success).toBe(true);
    }
  });
});
