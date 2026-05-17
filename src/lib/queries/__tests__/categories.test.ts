import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/gateway", () => ({
  gwGetActiveCategories: vi.fn(),
  gwGetCategoryBySlug: vi.fn(),
}));

import {
  gwGetActiveCategories,
  gwGetCategoryBySlug,
} from "@/lib/api/gateway";
import { getActiveCategories, getCategoryBySlug } from "../categories";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("categories.ts", () => {
  describe("getActiveCategories", () => {
    it("calls gwGetActiveCategories", async () => {
      vi.mocked(gwGetActiveCategories).mockResolvedValue([]);
      await getActiveCategories();
      expect(gwGetActiveCategories).toHaveBeenCalled();
    });
  });

  describe("getCategoryBySlug", () => {
    it("calls gwGetCategoryBySlug with slug and locale", async () => {
      vi.mocked(gwGetCategoryBySlug).mockResolvedValue(null);
      await getCategoryBySlug("electronics", "en");
      expect(gwGetCategoryBySlug).toHaveBeenCalledWith("electronics", "en");
    });
  });
});
