import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
  handleSyncProducts,
  handleUpdatePrices,
  handleTrackClick,
  handleSearchProducts,
} from "../handlers";
import { validateBearerToken } from "../utils";
import type { PAAPIItem, SearchItemsResponse, GetItemsResponse } from "../types";

const FUNCTIONS_DIR = path.resolve(__dirname, "../../../../supabase/functions");

function createMockSupabase() {
  const mockData: Record<string, unknown> = {};

  const chainable = (overrides?: Record<string, unknown>) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({ data: mockData.selectResult ?? [], error: null }),
      single: vi.fn().mockReturnValue({ data: mockData.singleResult ?? null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnValue({ data: mockData.rangeResult ?? [], error: null, count: 0 }),
      ...overrides,
    };
    // Make chainable methods return the chain
    for (const [key, fn] of Object.entries(chain)) {
      if (["select", "eq", "update", "textSearch"].includes(key)) {
        fn.mockReturnValue(chain);
      }
    }
    // Override terminal methods
    chain.eq.mockReturnValue({ data: mockData.selectResult ?? [], error: null });
    chain.single.mockReturnValue({ data: mockData.singleResult ?? null, error: null });
    chain.range.mockReturnValue({ data: mockData.rangeResult ?? [], error: null, count: 0 });
    return chain;
  };

  const fromChains: Record<string, ReturnType<typeof chainable>> = {};

  return {
    from: vi.fn((table: string) => {
      if (!fromChains[table]) {
        fromChains[table] = chainable();
      }
      return fromChains[table];
    }),
    _chains: fromChains,
    _setData: (data: Record<string, unknown>) => {
      Object.assign(mockData, data);
    },
  };
}

const mockItem: PAAPIItem = {
  ASIN: "B09V3KXJPB",
  DetailPageURL: "https://www.amazon.com/dp/B09V3KXJPB?tag=test-20",
  ItemInfo: {
    Title: { DisplayValue: "Test Product" },
    Features: { DisplayValues: ["Feature 1"] },
    ByLineInfo: { Brand: { DisplayValue: "TestBrand" } },
  },
  Offers: {
    Listings: [
      {
        Price: { Amount: 19.99, Currency: "USD", DisplayAmount: "$19.99" },
        Availability: { Type: "Now" },
      },
    ],
  },
  Images: {
    Primary: { Large: { URL: "https://example.com/img.jpg", Width: 500, Height: 500 } },
  },
};

describe("F3.6 — Edge Function Handlers", () => {
  describe("File-system validation", () => {
    it("TC-3.6.1: sync-amazon-products/index.ts exists", () => {
      const file = path.join(FUNCTIONS_DIR, "sync-amazon-products/index.ts");
      expect(fs.existsSync(file)).toBe(true);
    });

    it("TC-3.6.2: update-prices/index.ts exists", () => {
      const file = path.join(FUNCTIONS_DIR, "update-prices/index.ts");
      expect(fs.existsSync(file)).toBe(true);
    });

    it("TC-3.6.3: track-click/index.ts exists", () => {
      const file = path.join(FUNCTIONS_DIR, "track-click/index.ts");
      expect(fs.existsSync(file)).toBe(true);
    });

    it("TC-3.6.4: search-products/index.ts exists", () => {
      const file = path.join(FUNCTIONS_DIR, "search-products/index.ts");
      expect(fs.existsSync(file)).toBe(true);
    });

    it("TC-3.6.5: _shared/amazon-paapi.ts exists", () => {
      const file = path.join(FUNCTIONS_DIR, "_shared/amazon-paapi.ts");
      expect(fs.existsSync(file)).toBe(true);
    });

    it('TC-3.6.6: all edge function files contain "serve"', () => {
      const entryFiles = [
        "sync-amazon-products/index.ts",
        "update-prices/index.ts",
        "track-click/index.ts",
        "search-products/index.ts",
      ];
      for (const file of entryFiles) {
        const content = fs.readFileSync(path.join(FUNCTIONS_DIR, file), "utf-8");
        expect(content).toContain("serve");
      }
    });

    it("TC-3.6.7: cron functions check Authorization header", () => {
      const cronFiles = [
        "sync-amazon-products/index.ts",
        "update-prices/index.ts",
      ];
      for (const file of cronFiles) {
        const content = fs.readFileSync(path.join(FUNCTIONS_DIR, file), "utf-8");
        expect(content).toContain("Authorization");
      }
    });
  });

  describe("Handler logic", () => {
    it("TC-3.6.8: handleSyncProducts upserts products for each category", async () => {
      const supabase = createMockSupabase();
      const mockSearchItems = vi.fn().mockResolvedValue({
        SearchResult: { Items: [mockItem] },
      } satisfies SearchItemsResponse);

      const result = await handleSyncProducts({
        supabase: supabase as unknown as Parameters<typeof handleSyncProducts>[0]["supabase"],
        searchItems: mockSearchItems,
        categories: ["Electronics", "Books"],
      });

      expect(mockSearchItems).toHaveBeenCalledTimes(2);
      expect(supabase.from).toHaveBeenCalledWith("products");
      expect(result.synced).toBeGreaterThan(0);
      expect(result.errors).toEqual([]);
    });

    it("TC-3.6.9: handleUpdatePrices chunks ASINs and updates prices", async () => {
      const supabase = createMockSupabase();
      // Set up products for the select query
      supabase._setData({
        selectResult: [
          { id: "prod-1", asin: "B09V3KXJPB", price_cents: 1999 },
          { id: "prod-2", asin: "B08N5WRWNW", price_cents: 2999 },
        ],
      });
      // Rebuild the chain after setting data
      delete (supabase._chains as Record<string, unknown>)["products"];

      const mockGetItems = vi.fn().mockResolvedValue({
        ItemsResult: { Items: [mockItem] },
      } satisfies GetItemsResponse);

      const result = await handleUpdatePrices({
        supabase: supabase as unknown as Parameters<typeof handleUpdatePrices>[0]["supabase"],
        getItems: mockGetItems,
        chunkSize: 10,
      });

      expect(mockGetItems).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("products");
      expect(supabase.from).toHaveBeenCalledWith("price_history");
      expect(result).toHaveProperty("updated");
      expect(result).toHaveProperty("errors");
    });

    it("TC-3.6.10: handleTrackClick inserts a row into click_tracking", async () => {
      const supabase = createMockSupabase();

      const result = await handleTrackClick({
        supabase: supabase as unknown as Parameters<typeof handleTrackClick>[0]["supabase"],
        body: {
          product_id: "prod-123",
          locale: "en",
          session_id: "sess-abc",
          referrer: "https://google.com",
          user_agent: "Mozilla/5.0",
        },
        ipHash: "hashed-ip-value",
      });

      expect(supabase.from).toHaveBeenCalledWith("click_tracking");
      expect(result.success).toBe(true);
    });

    it("TC-3.6.11: handleSearchProducts queries correct search_vector per locale", async () => {
      const supabase = createMockSupabase();
      supabase._setData({ rangeResult: [] });

      await handleSearchProducts({
        supabase: supabase as unknown as Parameters<typeof handleSearchProducts>[0]["supabase"],
        query: "headphones",
        locale: "en",
        page: 1,
        pageSize: 10,
      });

      expect(supabase.from).toHaveBeenCalledWith("products");
      // Verify textSearch was called on the chain
      const productsChain = supabase._chains["products"];
      expect(productsChain?.textSearch).toHaveBeenCalledWith(
        "search_vector_en",
        "headphones",
        expect.any(Object),
      );

      // Test Bengali locale
      const supabase2 = createMockSupabase();
      supabase2._setData({ rangeResult: [] });

      await handleSearchProducts({
        supabase: supabase2 as unknown as Parameters<typeof handleSearchProducts>[0]["supabase"],
        query: "test",
        locale: "bn-BD",
        page: 1,
        pageSize: 10,
      });

      const productsChain2 = supabase2._chains["products"];
      expect(productsChain2?.textSearch).toHaveBeenCalledWith(
        "search_vector_bn",
        "test",
        expect.any(Object),
      );
    });

    it("TC-3.6.12: validateBearerToken rejects invalid tokens", () => {
      expect(validateBearerToken("Bearer correct-secret", "correct-secret")).toBe(true);
      expect(validateBearerToken("Bearer wrong", "correct-secret")).toBe(false);
      expect(validateBearerToken(null, "correct-secret")).toBe(false);
    });
  });
});
