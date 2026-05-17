import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadConfig } from "../config";

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns config when all environment variables are set", () => {
    process.env.AMAZON_ACCESS_KEY = "test-access-key";
    process.env.AMAZON_SECRET_KEY = "test-secret-key";
    process.env.AMAZON_PARTNER_TAG = "test-partner-tag";

    const config = loadConfig();

    expect(config).toEqual({
      accessKey: "test-access-key",
      secretKey: "test-secret-key",
      partnerTag: "test-partner-tag",
      host: "webservices.amazon.com",
      region: "us-east-1",
      marketplace: "www.amazon.com",
    });
  });

  it("throws error when AMAZON_ACCESS_KEY is missing", () => {
    process.env.AMAZON_ACCESS_KEY = "";
    process.env.AMAZON_SECRET_KEY = "test-secret-key";
    process.env.AMAZON_PARTNER_TAG = "test-partner-tag";

    expect(() => loadConfig()).toThrow(
      "Missing required environment variable: AMAZON_ACCESS_KEY"
    );
  });

  it("throws error when AMAZON_SECRET_KEY is missing", () => {
    process.env.AMAZON_ACCESS_KEY = "test-access-key";
    process.env.AMAZON_SECRET_KEY = "";
    process.env.AMAZON_PARTNER_TAG = "test-partner-tag";

    expect(() => loadConfig()).toThrow(
      "Missing required environment variable: AMAZON_SECRET_KEY"
    );
  });

  it("throws error when AMAZON_PARTNER_TAG is missing", () => {
    process.env.AMAZON_ACCESS_KEY = "test-access-key";
    process.env.AMAZON_SECRET_KEY = "test-secret-key";
    process.env.AMAZON_PARTNER_TAG = "";

    expect(() => loadConfig()).toThrow(
      "Missing required environment variable: AMAZON_PARTNER_TAG"
    );
  });

  it("throws error when AMAZON_PARTNER_TAG is undefined", () => {
    process.env.AMAZON_ACCESS_KEY = "test-access-key";
    process.env.AMAZON_SECRET_KEY = "test-secret-key";
    delete process.env.AMAZON_PARTNER_TAG;

    expect(() => loadConfig()).toThrow(
      "Missing required environment variable: AMAZON_PARTNER_TAG"
    );
  });
});
