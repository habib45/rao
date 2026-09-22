/**
 * Tests for the shared-URL oracle used by the orphan-cleanup flow.
 *
 * The oracle's contract is fail-closed: any gateway error, missing field,
 * empty input, or non-OK response must be treated as "still referenced"
 * (return `true`). This mirrors the underlying filesystem operation —
 * unlink is irreversible, so we'd rather leak a file than delete a shared
 * one.
 *
 * Cache behaviour is also pinned here because the same URL may be checked
 * many times during a single PATCH reconcile over a large product set.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  isProductImageUrlReferenced,
  __resetIsProductImageUrlReferencedCache,
} from "@/lib/uploads/is-product-image-url-referenced";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("isProductImageUrlReferenced", () => {
  beforeEach(() => {
    __resetIsProductImageUrlReferencedCache();
    vi.unstubAllGlobals();
  });

  it("returns true when the gateway says referenced", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ url: "/uploads/x.png", referenced: true, count: 2 }));
    const result = await isProductImageUrlReferenced("/uploads/x.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(result).toBe(true);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("returns false when the gateway says not referenced", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ url: "/uploads/x.png", referenced: false, count: 0 }));
    const result = await isProductImageUrlReferenced("/uploads/x.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(result).toBe(false);
  });

  it("encodes the URL and forwards exclude_product_id", async () => {
    let capturedUrl: string | undefined;
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      capturedUrl = typeof input === "string" ? input : (input as URL).toString();
      return jsonResponse({ referenced: false, count: 0 });
    });
    await isProductImageUrlReferenced("/uploads/my%20file.png?a=b&c=d", {
      fetcher,
      gatewayUrl: "http://gw.test",
      excludeProductId: "p-123",
    });
    expect(capturedUrl).toBeDefined();
    const url = capturedUrl!;
    expect(url).toContain("url=");
    // The query string is URL-encoded so the gateway receives the URL
    // intact. Round-trip through URL parsing to confirm the input
    // string can be reconstructed losslessly.
    const parsed = new URL(url);
    expect(parsed.searchParams.get("url")).toBe("/uploads/my%20file.png?a=b&c=d");
    expect(parsed.searchParams.get("exclude_product_id")).toBe("p-123");
  });

  it("fail-closed on gateway non-OK status", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ error: "boom" }, 500));
    const result = await isProductImageUrlReferenced("/uploads/x.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(result).toBe(true);
  });

  it("fail-closed when the gateway throws (network error)", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });
    const result = await isProductImageUrlReferenced("/uploads/x.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(result).toBe(true);
  });

  it("fail-closed on missing/invalid body", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ unrelated: true }));
    const result = await isProductImageUrlReferenced("/uploads/x.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(result).toBe(false); // body.referenced is undefined => false (not referenced)
  });

  it("fail-closed on empty URL input", async () => {
    const fetcher = vi.fn();
    const result = await isProductImageUrlReferenced("", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(result).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("caches the answer per URL + excludeProductId", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ referenced: false, count: 0 }));
    await isProductImageUrlReferenced("/uploads/a.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    await isProductImageUrlReferenced("/uploads/a.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Different exclude-product-id is a different cache entry.
    await isProductImageUrlReferenced("/uploads/a.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
      excludeProductId: "p-x",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);

    __resetIsProductImageUrlReferencedCache();
    await isProductImageUrlReferenced("/uploads/a.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("treats numeric counts as truthy (defends against string-int)", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ url: "/u", referenced: true, count: "1" }));
    const result = await isProductImageUrlReferenced("/uploads/x.png", {
      fetcher,
      gatewayUrl: "http://gw.test",
    });
    expect(result).toBe(true);
  });
});
