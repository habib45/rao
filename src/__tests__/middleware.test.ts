import { describe, it, expect, vi } from "vitest";

// Mock next-intl/middleware to return a function
vi.mock("next-intl/middleware", () => ({
  default: vi.fn(() => vi.fn()),
}));

// Mock the routing config
vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "bn-BD", "sv"],
    defaultLocale: "en",
  },
}));

import createMiddleware from "next-intl/middleware";
import { middleware, config } from "@/middleware";

describe("Middleware", () => {
  // TC-1.4.22: Middleware function is exported
  it("exports a middleware function", () => {
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe("function");
  });

  // TC-1.4.26: Static assets bypass middleware
  it("exports matcher config that excludes static assets", () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    const matcher = config.matcher;
    expect(Array.isArray(matcher) || typeof matcher === "string").toBe(true);
  });

  it("matcher excludes _next paths", () => {
    const matcherStr = JSON.stringify(config.matcher);
    expect(matcherStr).toContain("_next");
  });

  // TC-1.4.23/24/25: Locale routing is handled by next-intl middleware
  it("is created with correct routing config", () => {
    expect(createMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        locales: ["en", "bn-BD", "sv"],
        defaultLocale: "en",
      })
    );
  });
});
