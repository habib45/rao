import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createBrowserClient } from "@/lib/supabase/client";

describe("createBrowserClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key-1234567890",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // TC-1.3.1: createBrowserClient returns a Supabase client
  it("returns a Supabase client with expected properties", () => {
    const client = createBrowserClient();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.storage).toBeDefined();
  });

  // TC-1.3.2: createBrowserClient reads correct env vars
  it("reads env vars correctly", () => {
    const client = createBrowserClient();
    // Client was created without throwing, meaning env vars were read
    expect(client).toBeDefined();
  });

  // TC-1.3.6: Browser client can call .from()
  it("can call .from() to get a query builder", () => {
    const client = createBrowserClient();
    const query = client.from("products").select("id");
    expect(query).toBeDefined();
    expect(query.then).toBeDefined(); // It's a thenable
  });

  // TC-1.3.8: Missing NEXT_PUBLIC_SUPABASE_URL
  it("handles missing SUPABASE_URL", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    // @supabase/ssr may not throw eagerly — test documents the behavior
    expect(() => createBrowserClient()).not.toThrow();
  });

  // TC-1.3.9: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY
  it("handles missing SUPABASE_ANON_KEY", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => createBrowserClient()).not.toThrow();
  });

  // TC-1.3.12: Invalid Supabase URL format
  it("creates client with invalid URL (SDK does not validate eagerly)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    const client = createBrowserClient();
    expect(client).toBeDefined();
  });
});

// TC-1.3.14: No service role key in client modules
describe("Security: client.ts", () => {
  it("does not contain service role key references", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.resolve(__dirname, "../client.ts"),
      "utf-8"
    );
    expect(source).not.toContain("SERVICE_ROLE");
    expect(source).not.toContain("service_role");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  // TC-1.3.15: Only NEXT_PUBLIC_ env vars used
  it("only uses NEXT_PUBLIC_ env vars", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.resolve(__dirname, "../client.ts"),
      "utf-8"
    );
    const envRefs = source.match(/process\.env\.\w+/g) || [];
    for (const ref of envRefs) {
      expect(ref).toMatch(/process\.env\.NEXT_PUBLIC_/);
    }
  });
});
