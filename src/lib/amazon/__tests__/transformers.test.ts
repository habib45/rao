import { describe, it, expect } from "vitest";
import {
  slugify,
  transformPAAPIItem,
  transformPrice,
  extractPrimaryImage,
} from "../transformers";
import type { PAAPIItem } from "../types";

function createMockPAAPIItem(overrides?: Partial<PAAPIItem>): PAAPIItem {
  return {
    ASIN: "B09V3KXJPB",
    DetailPageURL: "https://www.amazon.com/dp/B09V3KXJPB?tag=test-20",
    ItemInfo: {
      Title: { DisplayValue: "Sony WH-1000XM5 Headphones" },
      Features: { DisplayValues: ["Noise cancelling", "30h battery", "Bluetooth 5.2"] },
      ByLineInfo: { Brand: { DisplayValue: "Sony" } },
    },
    Offers: {
      Listings: [
        {
          Price: { Amount: 29.99, Currency: "USD", DisplayAmount: "$29.99" },
          SavingBasis: { Amount: 49.99, Currency: "USD", DisplayAmount: "$49.99" },
          Availability: { Type: "Now" },
        },
      ],
    },
    Images: {
      Primary: {
        Large: {
          URL: "https://m.media-amazon.com/images/I/51example.jpg",
          Width: 500,
          Height: 500,
        },
      },
    },
    ...overrides,
  };
}

describe("F3.4 — Data Transformers", () => {
  describe("slugify", () => {
    it('TC-3.4.1: converts "Sony WH-1000XM5 Headphones" to correct slug', () => {
      expect(slugify("Sony WH-1000XM5 Headphones")).toBe(
        "sony-wh-1000xm5-headphones",
      );
    });

    it("TC-3.4.2: handles special chars, leading/trailing hyphens", () => {
      expect(slugify("  Hello, World!  ")).toBe("hello-world");
      expect(slugify("---test---")).toBe("test");
      expect(slugify("A++B==C")).toBe("a-b-c");
    });

    it("TC-3.4.3: handles empty string", () => {
      expect(slugify("")).toBe("");
    });
  });

  describe("transformPAAPIItem", () => {
    it("TC-3.4.4: maps all fields from a complete PA-API item", () => {
      const item = createMockPAAPIItem();
      const row = transformPAAPIItem(item);

      expect(row.asin).toBe("B09V3KXJPB");
      expect(row.name).toEqual({ en: "Sony WH-1000XM5 Headphones" });
      expect(row.slug).toEqual({ en: "sony-wh-1000xm5-headphones" });
      expect(row.description).toEqual({
        en: "Noise cancelling 30h battery Bluetooth 5.2",
      });
      expect(row.features).toEqual(["Noise cancelling", "30h battery", "Bluetooth 5.2"]);
      expect(row.brand).toBe("Sony");
      expect(row.affiliate_url).toBe(
        "https://www.amazon.com/dp/B09V3KXJPB?tag=test-20",
      );
      expect(row.is_active).toBe(true);
      expect(row.amazon_updated_at).toBeDefined();
    });

    it("TC-3.4.5: handles missing optional fields (no price, no brand, no features)", () => {
      const item = createMockPAAPIItem({
        ItemInfo: {
          Title: { DisplayValue: "Basic Product" },
        },
        Offers: undefined,
      });
      const row = transformPAAPIItem(item);

      expect(row.name).toEqual({ en: "Basic Product" });
      expect(row.price_cents).toBeNull();
      expect(row.original_price_cents).toBeNull();
      expect(row.brand).toBeNull();
      expect(row.features).toEqual([]);
      expect(row.currency).toBe("USD");
    });

    it("TC-3.4.6: calculates price_cents correctly (29.99 → 2999)", () => {
      const item = createMockPAAPIItem();
      const row = transformPAAPIItem(item);
      expect(row.price_cents).toBe(2999);
      expect(row.original_price_cents).toBe(4999);
    });

    it('TC-3.4.7: maps availability "Now" to "in_stock"', () => {
      const item = createMockPAAPIItem();
      const row = transformPAAPIItem(item);
      expect(row.availability).toBe("in_stock");
    });

    it('TC-3.4.8: maps non-"Now" availability to "out_of_stock"', () => {
      const item = createMockPAAPIItem({
        Offers: {
          Listings: [
            {
              Price: { Amount: 10, Currency: "USD", DisplayAmount: "$10.00" },
              Availability: { Type: "Backorder" },
            },
          ],
        },
      });
      const row = transformPAAPIItem(item);
      expect(row.availability).toBe("out_of_stock");
    });
  });

  describe("transformPrice", () => {
    it("TC-3.4.9: returns update and history objects with correct values", () => {
      const item = createMockPAAPIItem();
      const result = transformPrice(item, "product-uuid-123");

      expect(result).not.toBeNull();
      expect(result!.update.price_cents).toBe(2999);
      expect(result!.update.original_price_cents).toBe(4999);
      expect(result!.update.availability).toBe("in_stock");
      expect(result!.update.amazon_updated_at).toBeDefined();
      expect(result!.history.product_id).toBe("product-uuid-123");
      expect(result!.history.price_cents).toBe(2999);
      expect(result!.history.currency).toBe("USD");
    });

    it("TC-3.4.10: returns null when item has no price data", () => {
      const item = createMockPAAPIItem({ Offers: undefined });
      const result = transformPrice(item, "product-uuid-123");
      expect(result).toBeNull();
    });
  });

  describe("extractPrimaryImage", () => {
    it("TC-3.4.11: returns image data when present", () => {
      const item = createMockPAAPIItem();
      const image = extractPrimaryImage(item);

      expect(image).not.toBeNull();
      expect(image!.url).toBe(
        "https://m.media-amazon.com/images/I/51example.jpg",
      );
      expect(image!.width).toBe(500);
      expect(image!.height).toBe(500);
    });

    it("TC-3.4.12: returns null when no primary image", () => {
      const item = createMockPAAPIItem({ Images: undefined });
      expect(extractPrimaryImage(item)).toBeNull();
    });
  });
});
