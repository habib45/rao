import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/gateway", () => ({
  gwGetProductsFiltered: vi.fn(),
  gwGetRelatedProducts: vi.fn(),
}));

import { gwGetRelatedProducts } from "@/lib/api/gateway";
import { getComparisonCandidates } from "../comparison";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("comparison.ts", () => {
  describe("getComparisonCandidates", () => {
    it("calls gwGetRelatedProducts with productId and categoryId", async () => {
      vi.mocked(gwGetRelatedProducts).mockResolvedValue([]);
      await getComparisonCandidates("prod-123", "cat-456", 10);
      expect(gwGetRelatedProducts).toHaveBeenCalledWith("prod-123", "cat-456", 10);
    });

    it("returns empty array when categoryId is null", async () => {
      vi.mocked(gwGetRelatedProducts).mockResolvedValue([]);
      const result = await getComparisonCandidates("prod-123", null);
      expect(result).toEqual([]);
      expect(gwGetRelatedProducts).not.toHaveBeenCalled();
    });
  });
});
