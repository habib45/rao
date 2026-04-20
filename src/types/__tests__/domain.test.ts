import { describe, it, expectTypeOf } from "vitest";
import type {
  LocaleCode,
  TranslationMap,
  Product,
  ProductAvailability,
  ProductImage,
  Category,
  CartItem,
  ClickEvent,
  PriceHistoryEntry,
} from "@/types/domain";

// TC-1.2.1: LocaleCode is exactly 3 values
describe("LocaleCode", () => {
  it("accepts en, bn-BD, sv", () => {
    expectTypeOf<"en">().toMatchTypeOf<LocaleCode>();
    expectTypeOf<"bn-BD">().toMatchTypeOf<LocaleCode>();
    expectTypeOf<"sv">().toMatchTypeOf<LocaleCode>();
  });

  it("rejects invalid locale codes", () => {
    expectTypeOf<"fr">().not.toMatchTypeOf<LocaleCode>();
  });
});

// TC-1.2.2: TranslationMap accepts partial locales
describe("TranslationMap", () => {
  it("accepts partial locales", () => {
    expectTypeOf<{ en: "Hello" }>().toMatchTypeOf<TranslationMap>();
    expectTypeOf<{
      en: "Hello";
      "bn-BD": "হ্যালো";
    }>().toMatchTypeOf<TranslationMap>();
    expectTypeOf<Record<string, never>>().toMatchTypeOf<TranslationMap>();
  });

  // TC-1.2.3: TranslationMap generic type parameter
  it("supports generic type parameter", () => {
    expectTypeOf<{ en: ["Feature 1"] }>().toMatchTypeOf<
      TranslationMap<string[]>
    >();
    expectTypeOf<{ en: 42 }>().toMatchTypeOf<TranslationMap<number>>();
    // string is not assignable to string[]
    expectTypeOf<{ en: "not an array" }>().not.toMatchTypeOf<
      TranslationMap<string[]>
    >();
  });

  // TC-1.2.12: Empty TranslationMap at runtime
  it("allows empty object at compile time", () => {
    const empty: TranslationMap = {};
    expectTypeOf(empty).toMatchTypeOf<TranslationMap>();
  });
});

// TC-1.2.4: Product interface enforces required fields
describe("Product", () => {
  const validProduct: Product = {
    id: "uuid-1",
    asin: "B09V3KXJPB",
    category_id: null,
    name: { en: "Test Product" },
    slug: { en: "test-product" },
    description: { en: "A test product" },
    features: [],
    meta_title: { en: "Test" },
    meta_description: { en: "Test desc" },
    price_cents: 1999,
    original_price_cents: 2999,
    currency: "USD",
    discount_pct: 33,
    rating: 4.5,
    review_count: 100,
    affiliate_url: "https://amazon.com/dp/B09V3KXJPB?tag=test",
    brand: "TestBrand",
    availability: "in_stock",
    is_featured: false,
    is_active: true,
    product_images: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  it("compiles with all required fields", () => {
    expectTypeOf(validProduct).toMatchTypeOf<Product>();
  });

  it("requires asin field", () => {
    expectTypeOf<Omit<Product, "asin">>().not.toMatchTypeOf<Product>();
  });

  it("requires affiliate_url field", () => {
    expectTypeOf<Omit<Product, "affiliate_url">>().not.toMatchTypeOf<Product>();
  });

  // TC-1.2.5: Product.price_cents allows null
  it("allows null price_cents", () => {
    const product: Product = { ...validProduct, price_cents: null };
    expectTypeOf(product.price_cents).toEqualTypeOf<number | null>();
  });

  it("allows null original_price_cents", () => {
    const product: Product = { ...validProduct, original_price_cents: null };
    expectTypeOf(product.original_price_cents).toEqualTypeOf<number | null>();
  });

  // TC-1.2.13: Product with all nullable fields set to null
  it("accepts all nullable fields as null", () => {
    const product: Product = {
      ...validProduct,
      price_cents: null,
      original_price_cents: null,
      rating: null,
      brand: null,
      category_id: null,
    };
    expectTypeOf(product).toMatchTypeOf<Product>();
  });

  // TC-1.2.14: Product.discount_pct is number (not nullable)
  it("has discount_pct as number (not nullable)", () => {
    expectTypeOf<Product["discount_pct"]>().toEqualTypeOf<number>();
  });
});

// TC-1.2.6: ProductAvailability is a closed union
describe("ProductAvailability", () => {
  it("accepts valid values", () => {
    expectTypeOf<"in_stock">().toMatchTypeOf<ProductAvailability>();
    expectTypeOf<"out_of_stock">().toMatchTypeOf<ProductAvailability>();
    expectTypeOf<"unknown">().toMatchTypeOf<ProductAvailability>();
  });

  it("rejects invalid values", () => {
    expectTypeOf<"discontinued">().not.toMatchTypeOf<ProductAvailability>();
  });
});

// TC-1.2.7: ProductImage interface shape
describe("ProductImage", () => {
  it("enforces correct field types", () => {
    expectTypeOf<ProductImage["url"]>().toEqualTypeOf<string>();
    expectTypeOf<ProductImage["width"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ProductImage["height"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ProductImage["is_primary"]>().toEqualTypeOf<boolean>();
  });
});

// TC-1.2.8: Category interface shape
describe("Category", () => {
  it("allows null parent_id (top-level category)", () => {
    const topLevel: Category = {
      id: "uuid-1",
      amazon_node_id: null,
      name: { en: "Electronics" },
      slug: { en: "electronics" },
      description: { en: "Electronics" },
      parent_id: null,
      sort_order: 0,
      image_url: null,
      is_active: true,
    };
    expectTypeOf(topLevel).toMatchTypeOf<Category>();
  });

  it("allows string parent_id (child category)", () => {
    expectTypeOf<string | null>().toEqualTypeOf<Category["parent_id"]>();
  });
});

// TC-1.2.9: CartItem wraps Product with quantity
describe("CartItem", () => {
  it("has product and quantity fields", () => {
    expectTypeOf<CartItem["product"]>().toMatchTypeOf<Product>();
    expectTypeOf<CartItem["quantity"]>().toEqualTypeOf<number>();
  });
});

// TC-1.2.10: ClickEvent interface shape
describe("ClickEvent", () => {
  it("enforces correct field types", () => {
    expectTypeOf<ClickEvent["product_id"]>().toEqualTypeOf<string>();
    expectTypeOf<ClickEvent["locale"]>().toEqualTypeOf<LocaleCode>();
    expectTypeOf<ClickEvent["session_id"]>().toEqualTypeOf<string>();
  });
});

// TC-1.2.11: PriceHistoryEntry interface shape
describe("PriceHistoryEntry", () => {
  it("has non-nullable price_cents", () => {
    expectTypeOf<PriceHistoryEntry["price_cents"]>().toEqualTypeOf<number>();
  });

  it("has recorded_at as string", () => {
    expectTypeOf<PriceHistoryEntry["recorded_at"]>().toEqualTypeOf<string>();
  });
});

// TC-1.2.15: Typo in locale code
describe("Locale code strictness", () => {
  it("rejects underscore variant", () => {
    expectTypeOf<"bn_BD">().not.toMatchTypeOf<LocaleCode>();
  });

  it("rejects uppercase variant", () => {
    expectTypeOf<"BN-BD">().not.toMatchTypeOf<LocaleCode>();
  });
});

// TC-1.2.16: Wrong type for price_cents
describe("Price type safety", () => {
  it("rejects string for price_cents", () => {
    expectTypeOf<string>().not.toMatchTypeOf<Product["price_cents"]>();
  });

  it("allows float (TypeScript cannot enforce integer)", () => {
    // 19.99 is a valid number — TS can't distinguish int vs float
    expectTypeOf<19.99>().toMatchTypeOf<number>();
  });
});
