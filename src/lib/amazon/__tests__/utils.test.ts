import { describe, it, expect, vi } from "vitest";
import {
  chunkArray,
  exponentialBackoff,
  RateLimiter,
  validateBearerToken,
} from "../utils";

describe("F3.3 — Utility Functions", () => {
  describe("chunkArray", () => {
    it("TC-3.3.1: splits [1..10] into chunks of 3 → [3,3,3,1]", () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = chunkArray(arr, 3);
      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    it("TC-3.3.2: size >= array length returns single chunk", () => {
      const arr = [1, 2, 3];
      expect(chunkArray(arr, 5)).toEqual([[1, 2, 3]]);
      expect(chunkArray(arr, 3)).toEqual([[1, 2, 3]]);
    });

    it("TC-3.3.3: empty array returns empty array", () => {
      expect(chunkArray([], 10)).toEqual([]);
    });

    it("TC-3.3.4: size 10 chunks 25 items into [10,10,5] for GetItems batching", () => {
      const arr = Array.from({ length: 25 }, (_, i) => `ASIN${i}`);
      const chunks = chunkArray(arr, 10);
      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toHaveLength(10);
      expect(chunks[1]).toHaveLength(10);
      expect(chunks[2]).toHaveLength(5);
    });
  });

  describe("exponentialBackoff", () => {
    it("TC-3.3.5: returns result on first success", async () => {
      const fn = vi.fn().mockResolvedValue("ok");
      const mockDelay = vi.fn().mockResolvedValue(undefined);

      const result = await exponentialBackoff(fn, { delayFn: mockDelay });
      expect(result).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockDelay).not.toHaveBeenCalled();
    });

    it("TC-3.3.6: retries on failure and succeeds", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("429"))
        .mockRejectedValueOnce(new Error("429"))
        .mockResolvedValue("recovered");
      const mockDelay = vi.fn().mockResolvedValue(undefined);

      const result = await exponentialBackoff(fn, {
        delayFn: mockDelay,
        retryOn: () => true,
      });
      expect(result).toBe("recovered");
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockDelay).toHaveBeenCalledTimes(2);
      // Check exponential delays: 2000, 4000
      expect(mockDelay).toHaveBeenNthCalledWith(1, 2000);
      expect(mockDelay).toHaveBeenNthCalledWith(2, 4000);
    });

    it("TC-3.3.7: gives up after maxRetries", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("always fails"));
      const mockDelay = vi.fn().mockResolvedValue(undefined);

      await expect(
        exponentialBackoff(fn, {
          maxRetries: 3,
          delayFn: mockDelay,
          retryOn: () => true,
        }),
      ).rejects.toThrow("always fails");
      expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it("TC-3.3.8: respects retryOn predicate — skips non-retryable errors", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("500 Server Error"));
      const mockDelay = vi.fn().mockResolvedValue(undefined);
      const retryOn = (err: Error) => err.message.includes("429");

      await expect(
        exponentialBackoff(fn, { delayFn: mockDelay, retryOn }),
      ).rejects.toThrow("500 Server Error");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockDelay).not.toHaveBeenCalled();
    });

    it("TC-3.3.9: uses default delay function when no custom delayFn provided", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("429"))
        .mockResolvedValue("recovered");

      const result = await exponentialBackoff(fn, {
        maxRetries: 1,
        baseDelay: 10,
        retryOn: () => true,
      });

      expect(result).toBe("recovered");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("RateLimiter", () => {
    it("TC-3.3.9: enforces minimum interval between calls", async () => {
      const mockDelay = vi.fn().mockResolvedValue(undefined);
      const limiter = new RateLimiter(1100, mockDelay);

      // First call should be immediate (no delay)
      await limiter.acquire();
      expect(mockDelay).not.toHaveBeenCalled();

      // Simulate that no time has passed — second call should delay
      await limiter.acquire();
      expect(mockDelay).toHaveBeenCalledTimes(1);
      const delayMs = mockDelay.mock.calls[0][0];
      expect(delayMs).toBeGreaterThan(0);
      expect(delayMs).toBeLessThanOrEqual(1100);
    });

    it("TC-3.3.10: allows immediate call if interval has elapsed", async () => {
      const mockDelay = vi.fn().mockResolvedValue(undefined);
      const limiter = new RateLimiter(100, mockDelay);

      await limiter.acquire();
      // Manually advance lastCallTime to simulate time passing
      (limiter as unknown as { lastCallTime: number }).lastCallTime =
        Date.now() - 200;

      await limiter.acquire();
      // No delay needed since 200ms > 100ms interval
      expect(mockDelay).not.toHaveBeenCalled();
    });
  });

  describe("validateBearerToken", () => {
    it("TC-3.3.11: returns true for matching Bearer token", () => {
      expect(validateBearerToken("Bearer my-secret-123", "my-secret-123")).toBe(
        true,
      );
    });

    it("TC-3.3.12: returns false for null, wrong token, missing prefix", () => {
      expect(validateBearerToken(null, "secret")).toBe(false);
      expect(validateBearerToken("Bearer wrong", "secret")).toBe(false);
      expect(validateBearerToken("secret", "secret")).toBe(false);
      expect(validateBearerToken("", "secret")).toBe(false);
    });
  });
});
