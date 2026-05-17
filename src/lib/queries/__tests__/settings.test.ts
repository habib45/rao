import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
}));
vi.mock("@/lib/api/gateway", () => ({
  gwGetComparisonKeys: vi.fn(),
  gwGetSiteSettings: vi.fn(),
}));

import { gwGetComparisonKeys, gwGetSiteSettings } from "@/lib/api/gateway";
import { getComparisonKeys, getSiteSettings } from "../settings";

describe("settings.ts", () => {
  describe("getComparisonKeys", () => {
    it("calls gwGetComparisonKeys", async () => {
      vi.mocked(gwGetComparisonKeys).mockResolvedValue(["key1", "key2"]);
      const result = await getComparisonKeys();
      expect(gwGetComparisonKeys).toHaveBeenCalled();
      expect(result).toEqual(["key1", "key2"]);
    });
  });

  describe("getSiteSettings", () => {
    it("calls gwGetSiteSettings", async () => {
      vi.mocked(gwGetSiteSettings).mockResolvedValue({ showPrice: true });
      const result = await getSiteSettings();
      expect(gwGetSiteSettings).toHaveBeenCalled();
      expect(result).toEqual({ showPrice: true });
    });
  });
});
