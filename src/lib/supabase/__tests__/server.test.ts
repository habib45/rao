import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next/headers before importing the module
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const mockCookies = vi.mocked(cookies);

describe("createServerClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key-1234567890",
    };

    mockCookies.mockResolvedValue({
      getAll: () => [],
      set: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // TC-1.3.3: createServerClient returns a Supabase client
  it("returns a Supabase client with expected properties", async () => {
    const client = await createServerClient();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.storage).toBeDefined();
  });

  // TC-1.3.4: Server client integrates with cookies
  it("integrates with cookie store", async () => {
    const mockGetAll = vi.fn().mockReturnValue([
      { name: "sb-token", value: "abc" },
    ]);
    mockCookies.mockResolvedValue({
      getAll: mockGetAll,
      set: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    const client = await createServerClient();
    expect(client).toBeDefined();
  });

  // TC-1.3.5: Server client handles cookie write errors
  it("handles cookie write errors silently", async () => {
    const mockSet = vi.fn().mockImplementation(() => {
      throw new Error("Read-only cookies in Server Component");
    });
    mockCookies.mockResolvedValue({
      getAll: () => [],
      set: mockSet,
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    // Should not throw
    const client = await createServerClient();
    expect(client).toBeDefined();
  });

  // TC-1.3.7: Server client can call .from()
  it("can call .from() to get a query builder", async () => {
    const client = await createServerClient();
    const query = client.from("products").select("id");
    expect(query).toBeDefined();
    expect(query.then).toBeDefined();
  });

  // TC-1.3.10: Multiple sequential createServerClient calls
  it("returns distinct instances on multiple calls", async () => {
    const client1 = await createServerClient();
    const client2 = await createServerClient();
    const client3 = await createServerClient();
    expect(client1).not.toBe(client2);
    expect(client2).not.toBe(client3);
  });

  // TC-1.3.11: Empty cookie store
  it("creates client with empty cookie store", async () => {
    mockCookies.mockResolvedValue({
      getAll: () => [],
      set: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    const client = await createServerClient();
    expect(client).toBeDefined();
  });
});

// TC-1.3.14: No service role key in server modules
describe("Security: server.ts", () => {
  it("does not contain service role key references", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.resolve(__dirname, "../server.ts"),
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
      path.resolve(__dirname, "../server.ts"),
      "utf-8"
    );
    const envRefs = source.match(/process\.env\.\w+/g) || [];
    for (const ref of envRefs) {
      expect(ref).toMatch(/process\.env\.NEXT_PUBLIC_/);
    }
  });
});
