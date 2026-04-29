import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const paapiItemBase = {
  ASIN: "B0ABCDEFGH",
  DetailPageURL: "https://www.amazon.com/dp/B0ABCDEFGH?tag=test-20",
  ItemInfo: {
    Title: { DisplayValue: "Wireless Headphones" },
    Features: { DisplayValues: ["Noise cancelling", "30h battery"] },
    ByLineInfo: { Brand: { DisplayValue: "Acme" } },
  },
  Offers: {
    Listings: [
      {
        Price: { Amount: 49.99, Currency: "USD", DisplayAmount: "$49.99" },
        Availability: { Type: "Now" },
      },
    ],
  },
  Images: {
    Primary: { Large: { URL: "https://example.com/img.jpg", Width: 500, Height: 500 } },
  },
};

// ── Thenable Supabase stub ────────────────────────────────────────────────────

interface StubOverrides {
  upsertData?: unknown;
  upsertError?: { message: string } | null;
  invokeData?: unknown;
  invokeError?: { message: string } | null;
}

function makeSupabaseStub(overrides: StubOverrides = {}) {
  const upsertChain = {
    data: overrides.upsertData ?? { id: "prod-uuid", asin: "B0ABCDEFGH", name: { en: "Wireless Headphones" } },
    error: overrides.upsertError ?? null,
  };

  const imagesUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const productsUpsert = vi.fn().mockReturnThis();
  const productsSelect = vi.fn().mockReturnThis();
  const productsSingle = vi.fn().mockResolvedValue(upsertChain);

  const from = vi.fn((table: string) => {
    if (table === "products") {
      return {
        upsert: productsUpsert,
        select: productsSelect,
        single: productsSingle,
      };
    }
    if (table === "product_images") {
      return { upsert: imagesUpsert };
    }
    return { upsert: vi.fn().mockResolvedValue({ data: null, error: null }) };
  });

  const functionsInvoke = vi.fn().mockResolvedValue({
    data: overrides.invokeData ?? { item: paapiItemBase },
    error: overrides.invokeError ?? null,
  });

  return {
    stub: {
      from,
      functions: { invoke: functionsInvoke },
    },
    spies: { productsUpsert, imagesUpsert, functionsInvoke, productsSingle },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/admin/api/products/import/route";

function makeRequest(body?: unknown) {
  return new NextRequest("http://localhost/admin/api/products/import", {
    method: "POST",
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : { body: "{}", headers: { "Content-Type": "application/json" } }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /admin/api/products/import", () => {
  it("returns 201 with product data for a valid ASIN", async () => {
    const { stub } = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await POST(makeRequest({ asin: "B0ABCDEFGH" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({
      product_id: "prod-uuid",
      asin: "B0ABCDEFGH",
      name: { en: "Wireless Headphones" },
    });
  });

  it("returns 400 when the ASIN is too short", async () => {
    const res = await POST(makeRequest({ asin: "ABC" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when the ASIN is too long", async () => {
    const res = await POST(makeRequest({ asin: "ABCDEFGHIJK" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the ASIN contains lowercase letters", async () => {
    const res = await POST(makeRequest({ asin: "b0abcdefgh" }));
    expect(res.status).toBe(400);
  });

  it("returns 502 when the Edge Function returns an error", async () => {
    const { stub } = makeSupabaseStub({
      invokeError: { message: "PA-API 503" },
      invokeData: null,
    });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await POST(makeRequest({ asin: "B0ABCDEFGH" }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/Amazon import failed/);
  });

  it("returns 502 when the Edge Function returns no item", async () => {
    const { stub } = makeSupabaseStub({ invokeData: { item: null } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await POST(makeRequest({ asin: "B0ABCDEFGH" }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/not found on Amazon/);
  });

  it("upserts onto products with onConflict=asin so existing rows are updated", async () => {
    const { stub, spies } = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await POST(makeRequest({ asin: "B0ABCDEFGH" }));
    expect(res.status).toBe(201);

    const upsertCall = spies.productsUpsert.mock.calls[0];
    expect(upsertCall?.[0]).toMatchObject({ asin: "B0ABCDEFGH", is_active: false });
    expect(upsertCall?.[1]).toEqual({ onConflict: "asin" });
  });

  it("upserts the primary image when the PA-API payload includes one", async () => {
    const { stub, spies } = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    await POST(makeRequest({ asin: "B0ABCDEFGH" }));

    expect(spies.imagesUpsert).toHaveBeenCalledTimes(1);
    const [row, options] = spies.imagesUpsert.mock.calls[0];
    expect(row).toMatchObject({
      product_id: "prod-uuid",
      url: "https://example.com/img.jpg",
      is_primary: true,
    });
    expect(options).toEqual({ onConflict: "product_id,is_primary" });
  });
});
