// F18.2 — Admin newsletter API route tests (TC-18.2.4 – 18.2.7)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Supabase stub ─────────────────────────────────────────────────────────────

function makeSupabaseStub(
  overrides: {
    data?: unknown;
    count?: number | null;
    error?: { message: string } | null;
  } = {},
) {
  const chain = {
    data: overrides.data ?? null,
    count: overrides.count ?? null,
    error: overrides.error ?? null,
  };
  const stub: Record<string, unknown> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(chain),
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
vi.mock("@/app/admin/_lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-1",
    email: "admin@example.com",
    app_metadata: { role: "admin" },
  }),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  GET as settingsGET,
  PATCH as settingsPATCH,
} from "@/app/admin/api/newsletter/settings/route";
import { GET as subscribersGET } from "@/app/admin/api/newsletter/subscribers/route";

const VALID_SETTINGS = {
  show: true,
  title: "Stay in the loop",
  subtitle: "Get deals in your inbox.",
  background: "indigo",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Settings GET ──────────────────────────────────────────────────────────────

describe("GET /admin/api/newsletter/settings", () => {
  it("TC-18.2.4 returns 200 with settings object", async () => {
    const stub = makeSupabaseStub({ data: { value: VALID_SETTINGS } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await settingsGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ show: true, title: "Stay in the loop" });
  });

  it("returns 200 with empty object when no settings exist", async () => {
    const stub = makeSupabaseStub({ data: null });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await settingsGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({});
  });

  it("returns 500 on Supabase error", async () => {
    const stub = makeSupabaseStub({ error: { message: "DB error" } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await settingsGET();
    expect(res.status).toBe(500);
  });
});

// ── Settings PATCH ────────────────────────────────────────────────────────────

function makePatchRequest(body: unknown) {
  return new NextRequest("http://localhost/admin/api/newsletter/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("PATCH /admin/api/newsletter/settings", () => {
  it("TC-18.2.5 returns 200 with valid body", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await settingsPATCH(makePatchRequest(VALID_SETTINGS));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("TC-18.2.6 returns 400 for invalid body (missing title)", async () => {
    const res = await settingsPATCH(
      makePatchRequest({ show: true, subtitle: "hi", background: "indigo" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 for invalid background value", async () => {
    const res = await settingsPATCH(
      makePatchRequest({ ...VALID_SETTINGS, background: "purple" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest(
      "http://localhost/admin/api/newsletter/settings",
      { method: "PATCH", body: "not-json" },
    );
    const res = await settingsPATCH(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 on Supabase error", async () => {
    const stub = makeSupabaseStub({ error: { message: "upsert failed" } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await settingsPATCH(makePatchRequest(VALID_SETTINGS));
    expect(res.status).toBe(500);
  });
});

// ── Subscribers GET ───────────────────────────────────────────────────────────

function makeSubscribersRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/admin/api/newsletter/subscribers");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

describe("GET /admin/api/newsletter/subscribers", () => {
  it("TC-18.2.7 returns 200 with data and total", async () => {
    const subscribers = [
      { id: "s-1", email: "a@example.com", is_active: true, subscribed_at: new Date().toISOString() },
    ];
    const stub = makeSupabaseStub({ data: subscribers, count: 1 });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await subscribersGET(makeSubscribersRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.data).toHaveLength(1);
  });

  it("applies email search via ilike when q param is provided", async () => {
    const stub = makeSupabaseStub({ data: [], count: 0 });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    await subscribersGET(makeSubscribersRequest({ q: "example" }));

    expect(stub.ilike).toHaveBeenCalledWith("email", "%example%");
  });

  it("clamps perPage to a maximum of 100", async () => {
    const stub = makeSupabaseStub({ data: [], count: 0 });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    await subscribersGET(makeSubscribersRequest({ perPage: "999" }));

    expect(stub.range).toHaveBeenCalledWith(0, 99);
  });

  it("returns 500 on Supabase error", async () => {
    const stub = makeSupabaseStub({ error: { message: "DB error" } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await subscribersGET(makeSubscribersRequest());
    expect(res.status).toBe(500);
  });
});
