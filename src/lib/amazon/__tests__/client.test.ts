import { describe, it, expect, vi } from "vitest";
import { createPAAPIClient } from "../client";
import type { PAAPIConfig, SearchItemsResponse, GetItemsResponse } from "../types";
import { RateLimiter } from "../utils";

const testConfig: PAAPIConfig = {
  accessKey: "AKIAIOSFODNN7EXAMPLE",
  secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  partnerTag: "test-tag-20",
  host: "webservices.amazon.com",
  region: "us-east-1",
  marketplace: "www.amazon.com",
};

const mockSearchResponse: SearchItemsResponse = {
  SearchResult: {
    Items: [{ ASIN: "B09V3KXJPB", DetailPageURL: "https://amazon.com/dp/B09V3KXJPB" }],
    TotalResultCount: 1,
  },
};

const mockGetResponse: GetItemsResponse = {
  ItemsResult: {
    Items: [{ ASIN: "B09V3KXJPB", DetailPageURL: "https://amazon.com/dp/B09V3KXJPB" }],
  },
};

function createTestClient() {
  const mockFetch = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>();
  const mockRateLimiter = new RateLimiter(0, vi.fn().mockResolvedValue(undefined));
  vi.spyOn(mockRateLimiter, "acquire");
  const passthrough = <T>(fn: () => Promise<T>) => fn();

  const client = createPAAPIClient({
    config: testConfig,
    fetchFn: mockFetch as unknown as typeof fetch,
    rateLimiter: mockRateLimiter,
    backoff: passthrough,
  });

  return { client, mockFetch, mockRateLimiter };
}

describe("F3.5 — PA-API Client", () => {
  it("TC-3.5.1: searchItems calls fetch with correct URL", async () => {
    const { client, mockFetch } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockSearchResponse), { status: 200 }),
    );

    await client.searchItems("headphones");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://webservices.amazon.com/paapi5/searchitems");
  });

  it("TC-3.5.2: searchItems includes signed headers in fetch call", async () => {
    const { client, mockFetch } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockSearchResponse), { status: 200 }),
    );

    await client.searchItems("headphones");
    const [, init] = mockFetch.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toMatch(/^AWS4-HMAC-SHA256/);
    expect(headers["X-Amz-Target"]).toContain("SearchItems");
    expect(headers["Content-Type"]).toBe("application/json; charset=utf-8");
  });

  it("TC-3.5.3: searchItems returns parsed JSON on 200 response", async () => {
    const { client, mockFetch } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockSearchResponse), { status: 200 }),
    );

    const result = await client.searchItems("headphones");
    expect(result.SearchResult?.Items).toHaveLength(1);
    expect(result.SearchResult?.Items?.[0].ASIN).toBe("B09V3KXJPB");
  });

  it("TC-3.5.4: searchItems throws on non-OK response", async () => {
    const { client, mockFetch } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response("TooManyRequests", { status: 429 }),
    );

    await expect(client.searchItems("headphones")).rejects.toThrow("429");
  });

  it("TC-3.5.5: getItems calls fetch with correct URL", async () => {
    const { client, mockFetch } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockGetResponse), { status: 200 }),
    );

    await client.getItems(["B09V3KXJPB"]);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://webservices.amazon.com/paapi5/getitems");
  });

  it("TC-3.5.6: getItems sends correct payload with ItemIds array", async () => {
    const { client, mockFetch } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockGetResponse), { status: 200 }),
    );

    await client.getItems(["B09V3KXJPB", "B08N5WRWNW"]);
    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.ItemIds).toEqual(["B09V3KXJPB", "B08N5WRWNW"]);
    expect(body.ItemIdType).toBe("ASIN");
    expect(body.PartnerTag).toBe("test-tag-20");
  });

  it("TC-3.5.7: getItems throws on non-OK response", async () => {
    const { client, mockFetch } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response("Service Unavailable", { status: 503 }),
    );

    await expect(client.getItems(["B09V3KXJPB"])).rejects.toThrow("503");
  });

  it("TC-3.5.8: rate limiter acquire() is called before each request", async () => {
    const { client, mockFetch, mockRateLimiter } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockSearchResponse), { status: 200 }),
    );

    await client.searchItems("test");
    expect(mockRateLimiter.acquire).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockGetResponse), { status: 200 }),
    );
    await client.getItems(["B09V3KXJPB"]);
    expect(mockRateLimiter.acquire).toHaveBeenCalledTimes(2);
  });

  it("TC-3.5.9: backoff wrapper is used for the fetch call", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockSearchResponse), { status: 200 }),
    );
    const mockBackoff = vi.fn(<T>(fn: () => Promise<T>) => fn());
    const mockRateLimiter = new RateLimiter(0, vi.fn().mockResolvedValue(undefined));

    const client = createPAAPIClient({
      config: testConfig,
      fetchFn: mockFetch as unknown as typeof fetch,
      rateLimiter: mockRateLimiter,
      backoff: mockBackoff as <T>(fn: () => Promise<T>) => Promise<T>,
    });

    await client.searchItems("test");
    expect(mockBackoff).toHaveBeenCalledTimes(1);
    expect(typeof mockBackoff.mock.calls[0][0]).toBe("function");
  });

  it("TC-3.5.10: searchItems payload includes all required Resources", async () => {
    const { client, mockFetch } = createTestClient();
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(mockSearchResponse), { status: 200 }),
    );

    await client.searchItems("headphones", "Electronics");
    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init?.body as string);

    expect(body.Resources).toContain("Images.Primary.Large");
    expect(body.Resources).toContain("ItemInfo.Title");
    expect(body.Resources).toContain("ItemInfo.Features");
    expect(body.Resources).toContain("Offers.Listings.Price");
    expect(body.SearchIndex).toBe("Electronics");
  });
});
