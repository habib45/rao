// F18.2 — Newsletter subscribe API route tests (TC-18.2.1 – 18.2.3)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function makeSupabaseStub(
  overrides: { error?: { message: string } | null } = {},
) {
  const chain = {
    data: null,
    error: overrides.error ?? null,
  };
  const stub: Record<string, unknown> = {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    then(
      resolve: (v: typeof chain) => unknown,
      reject?: (e: unknown) => unknown,
    ) {
      return Promise.resolve(chain).then(resolve, reject);
    },
  };
  return stub;
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/api/newsletter/subscribe/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/newsletter/subscribe", () => {
  it("TC-18.2.1 returns 200 with valid email and consent", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await POST(makeRequest({ email: "user@example.com", consent: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("TC-18.2.2 returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", consent: true }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("TC-18.2.3 returns 400 when consent is false", async () => {
    const res = await POST(makeRequest({ email: "user@example.com", consent: false }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when consent is missing", async () => {
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({ consent: true }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/newsletter/subscribe", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 on Supabase error", async () => {
    const stub = makeSupabaseStub({ error: { message: "DB write failed" } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await POST(makeRequest({ email: "user@example.com", consent: true }));
    expect(res.status).toBe(500);
  });

  it("accepts an optional locale", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await POST(
      makeRequest({ email: "user@example.com", consent: true, locale: "sv" }),
    );
    expect(res.status).toBe(200);
  });
});
