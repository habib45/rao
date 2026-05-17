import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
}));

import { getNewsletterSettings } from "../newsletter";

describe("newsletter.ts", () => {
  describe("getNewsletterSettings", () => {
    it("returns default settings when gateway not implemented", async () => {
      const settings = await getNewsletterSettings();
      expect(settings).toEqual({
        show: true,
        title: "Subscribe to our newsletter",
        subtitle:
          "Sign up to receive our latest news and products. Stay updated on the latest developments and special offers!",
        background: "indigo",
      });
    });
  });
});
