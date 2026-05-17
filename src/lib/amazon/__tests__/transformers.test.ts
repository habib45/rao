import { describe, it, expect } from "vitest";
import {
  slugify,
  transformPAAPIItem,
  transformPrice,
  extractPrimaryImage,
  previewFromPAAPIItem,
  transformCatalogItemResponse,
} from "../transformers";
import type { PAAPIItem, CatalogItemResponse } from "../types";

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

  describe("previewFromPAAPIItem", () => {
    it("transforms PAAPIItem into ProductPreviewData with images", () => {
      const item = createMockPAAPIItem({
        Images: {
          Primary: {
            Large: {
              URL: "https://m.media-amazon.com/images/I/51example.jpg",
              Width: 500,
              Height: 500,
            },
          },
          Variants: [
            {
              Large: {
                URL: "https://m.media-amazon.com/images/I/52variant.jpg",
                Width: 600,
                Height: 600,
              },
            },
          ],
        },
      });

      const preview = previewFromPAAPIItem(item);

      expect(preview.asin).toBe("B09V3KXJPB");
      expect(preview.name).toEqual({ en: "Sony WH-1000XM5 Headphones" });
      expect(preview.slug).toEqual({ en: "sony-wh-1000xm5-headphones" });
      expect(preview.price_cents).toBe(2999);
      expect(preview.original_price_cents).toBe(4999);
      expect(preview.brand).toBe("Sony");
      expect(preview.availability).toBe("in_stock");
      expect(preview.images).toHaveLength(2);
      expect(preview.images[0].variant).toBe("MAIN");
      expect(preview.images[1].variant).toBe("PT");
    });

    it("handles item with no images", () => {
      const item = createMockPAAPIItem({ Images: undefined });
      const preview = previewFromPAAPIItem(item);

      expect(preview.images).toEqual([]);
    });

    it("handles item with no primary image but has variants", () => {
      const item = createMockPAAPIItem({
        Images: {
          Variants: [
            {
              Large: {
                URL: "https://m.media-amazon.com/images/I/52variant.jpg",
                Width: 600,
                Height: 600,
              },
            },
          ],
        },
      });

      const preview = previewFromPAAPIItem(item);

      expect(preview.images).toHaveLength(1);
      expect(preview.images[0].variant).toBe("PT");
    });
  });

  describe("transformCatalogItemResponse", () => {
    function createMockCatalogItem(overrides?: Partial<CatalogItemResponse>): CatalogItemResponse {
      return {
        asin: "B09V3KXJPB",
        attributes: {
          item_name: [{ value: "Sony WH-1000XM5 Headphones" }],
          brand: [{ value: "Sony" }],
          bullet_point: [
            { value: "Noise cancelling" },
            { value: "30h battery" },
            { value: "Bluetooth 5.2" },
          ],
          list_price: [{ value: 29.99, currency: "USD" }],
          color: [{ value: "Black" }],
          model_number: [{ value: "WH-1000XM5" }],
          warranty_description: [{ value: "1 year warranty" }],
        },
        summaries: [
          {
            marketplaceId: "ATVPDKIKX0DER",
            itemName: "Sony WH-1000XM5 Headphones",
            brand: "Sony",
            modelNumber: "WH-1000XM5",
            color: "Black",
          },
        ],
        images: [
          {
            marketplaceId: "ATVPDKIKX0DER",
            images: [
              { variant: "MAIN", link: "https://example.com/main.jpg", width: 500, height: 500 },
              { variant: "PT01", link: "https://example.com/pt1.jpg", width: 600, height: 600 },
              { variant: "PT02", link: "https://example.com/pt2.jpg", width: 600, height: 600 },
            ],
          },
        ],
        ...overrides,
      };
    }

    it("transforms CatalogItemResponse into ProductPreviewData", () => {
      const catalogItem = createMockCatalogItem();
      const preview = transformCatalogItemResponse(catalogItem);

      expect(preview.asin).toBe("B09V3KXJPB");
      expect(preview.name).toEqual({ en: "Sony WH-1000XM5 Headphones" });
      expect(preview.slug).toEqual({ en: "sony-wh-1000xm5-headphones" });
      expect(preview.brand).toBe("Sony");
      expect(preview.price_cents).toBe(2999);
      expect(preview.currency).toBe("USD");
      expect(preview.features).toEqual(["Noise cancelling", "30h battery", "Bluetooth 5.2"]);
      expect(preview.availability).toBe("unknown");
      expect(preview.affiliate_url).toBe("https://www.amazon.com/dp/B09V3KXJPB");
    });

    it("uses item_name from attributes when summary missing", () => {
      const catalogItem = createMockCatalogItem({ summaries: undefined });
      const preview = transformCatalogItemResponse(catalogItem);

      expect(preview.name).toEqual({ en: "Sony WH-1000XM5 Headphones" });
    });

    it("falls back to ASIN when no title available", () => {
      const catalogItem = createMockCatalogItem({
        summaries: undefined,
        attributes: { item_name: undefined },
      });
      const preview = transformCatalogItemResponse(catalogItem);

      expect(preview.name).toEqual({ en: "B09V3KXJPB" });
    });

    it("handles missing list price", () => {
      const catalogItem = createMockCatalogItem({
        attributes: { list_price: undefined },
      });
      const preview = transformCatalogItemResponse(catalogItem);

      expect(preview.price_cents).toBeNull();
      expect(preview.currency).toBe("USD");
    });

    it("deduplicates images by link", () => {
      const catalogItem = createMockCatalogItem({
        images: [
          {
            marketplaceId: "ATVPDKIKX0DER",
            images: [
              { variant: "MAIN", link: "https://example.com/main.jpg", width: 500, height: 500 },
              { variant: "MAIN", link: "https://example.com/main.jpg", width: 600, height: 600 },
              { variant: "PT01", link: "https://example.com/pt1.jpg", width: 600, height: 600 },
            ],
          },
        ],
      });
      const preview = transformCatalogItemResponse(catalogItem);

      expect(preview.images).toHaveLength(2);
    });

    it("limits images to 10", () => {
      const images = Array.from({ length: 15 }, (_, i) => ({
        variant: `PT${i}`,
        link: `https://example.com/img${i}.jpg`,
        width: 500,
        height: 500,
      }));

      const catalogItem = createMockCatalogItem({
        images: [
          {
            marketplaceId: "ATVPDKIKX0DER",
            images,
          },
        ],
      });
      const preview = transformCatalogItemResponse(catalogItem);

      expect(preview.images).toHaveLength(10);
    });

    it("builds attributes map from catalog attributes", () => {
      const catalogItem = createMockCatalogItem({
        attributes: {
          item_name: [{ value: "Test" }],
          color: [{ value: "Black" }],
          style: [{ value: "Modern" }],
          warranty_description: [{ value: "2 years" }],
          connectivity_technology: [{ value: "Bluetooth" }, { value: "WiFi" }],
          resolution: [{ value: "4K" }],
          refresh_rate: [{ value: 60, unit: "Hz" }],
          item_weight: [{ value: 250, unit: "g" }],
          special_feature: [{ value: "Water resistant" }],
        },
        summaries: [
          {
            marketplaceId: "ATVPDKIKX0DER",
            itemName: "Test",
            modelNumber: "WH-1000XM5",
            size: "Large",
          },
        ],
      });
      const preview = transformCatalogItemResponse(catalogItem);

      expect(preview.attributes).toEqual({
        model_number: "WH-1000XM5",
        color: "Black",
        size: "Large",
        style: "Modern",
        warranty: "2 years",
        connectivity: "Bluetooth, WiFi",
        resolution: "4K",
        refresh_rate: "60 Hz",
        weight: "250 g",
        special_features: "Water resistant",
      });
    });

    it("handles missing attributes gracefully", () => {
      const catalogItem = createMockCatalogItem({
        attributes: undefined,
        summaries: undefined,
        images: undefined,
      });
      const preview = transformCatalogItemResponse(catalogItem);

      expect(preview.name).toEqual({ en: "B09V3KXJPB" });
      expect(preview.brand).toBeNull();
      expect(preview.features).toEqual([]);
      expect(preview.price_cents).toBeNull();
      expect(preview.images).toEqual([]);
      expect(preview.attributes).toEqual({});
    });
  });
});
