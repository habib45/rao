import { describe, it, expect, expectTypeOf, beforeEach, afterEach } from "vitest";
import type {
  PAAPIConfig,
  PAAPIOperation,
  SearchItemsResponse,
  GetItemsResponse,
} from "../types";
import { loadConfig } from "../config";

// TC-3.1.1
describe("F3.1 — PA-API Types & Config", () => {
  describe("PAAPIConfig", () => {
    it("TC-3.1.1: accepts a valid config object with all required fields", () => {
      const config: PAAPIConfig = {
        accessKey: "AKIAIOSFODNN7EXAMPLE",
        secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        partnerTag: "test-tag-20",
        host: "webservices.amazon.com",
        region: "us-east-1",
        marketplace: "www.amazon.com",
      };
      expectTypeOf(config).toMatchTypeOf<PAAPIConfig>();
      expect(config.accessKey).toBe("AKIAIOSFODNN7EXAMPLE");
    });
  });

  describe("PAAPIOperation", () => {
    it('TC-3.1.2: accepts "SearchItems" and "GetItems"', () => {
      const search: PAAPIOperation = "SearchItems";
      const get: PAAPIOperation = "GetItems";
      expectTypeOf(search).toMatchTypeOf<PAAPIOperation>();
      expectTypeOf(get).toMatchTypeOf<PAAPIOperation>();
    });

    it("TC-3.1.3: rejects invalid operation strings at type level", () => {
      // @ts-expect-error — "InvalidOp" is not assignable to PAAPIOperation
      const invalid: PAAPIOperation = "InvalidOp";
      expect(invalid).toBeDefined(); // compilation check
    });
  });

  describe("Response types", () => {
    it("TC-3.1.4: SearchItemsResponse accepts valid response shape", () => {
      const response: SearchItemsResponse = {
        SearchResult: {
          Items: [
            {
              ASIN: "B09V3KXJPB",
              DetailPageURL: "https://www.amazon.com/dp/B09V3KXJPB",
            },
          ],
          TotalResultCount: 1,
        },
      };
      expectTypeOf(response).toMatchTypeOf<SearchItemsResponse>();
      expect(response.SearchResult?.Items).toHaveLength(1);
    });

    it("TC-3.1.5: GetItemsResponse accepts valid response shape", () => {
      const response: GetItemsResponse = {
        ItemsResult: {
          Items: [
            {
              ASIN: "B09V3KXJPB",
              DetailPageURL: "https://www.amazon.com/dp/B09V3KXJPB",
              Offers: {
                Listings: [
                  {
                    Price: { Amount: 29.99, Currency: "USD", DisplayAmount: "$29.99" },
                  },
                ],
              },
            },
          ],
        },
      };
      expectTypeOf(response).toMatchTypeOf<GetItemsResponse>();
      expect(response.ItemsResult?.Items).toHaveLength(1);
    });
  });

  describe("loadConfig()", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("TC-3.1.6: returns valid config when all env vars are set", () => {
      process.env.AMAZON_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
      process.env.AMAZON_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
      process.env.AMAZON_PARTNER_TAG = "mystore-20";

      const config = loadConfig();
      expect(config.accessKey).toBe("AKIAIOSFODNN7EXAMPLE");
      expect(config.secretKey).toBe("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
      expect(config.partnerTag).toBe("mystore-20");
      expect(config.host).toBe("webservices.amazon.com");
      expect(config.region).toBe("us-east-1");
      expect(config.marketplace).toBe("www.amazon.com");
    });

    it("TC-3.1.7: throws when AMAZON_ACCESS_KEY is missing", () => {
      process.env.AMAZON_SECRET_KEY = "secret";
      process.env.AMAZON_PARTNER_TAG = "tag";
      delete process.env.AMAZON_ACCESS_KEY;

      expect(() => loadConfig()).toThrow("AMAZON_ACCESS_KEY");
    });

    it("TC-3.1.8: throws when AMAZON_SECRET_KEY is missing", () => {
      process.env.AMAZON_ACCESS_KEY = "key";
      process.env.AMAZON_PARTNER_TAG = "tag";
      delete process.env.AMAZON_SECRET_KEY;

      expect(() => loadConfig()).toThrow("AMAZON_SECRET_KEY");
    });
  });
});
