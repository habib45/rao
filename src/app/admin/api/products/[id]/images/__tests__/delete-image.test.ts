/**
 * Tests for the per-image DELETE route at
 * /admin/api/products/[id]/images/[imageId].
 *
 * Policy pinned here:
 *   1. Forward the DELETE to the gateway.
 *   2. On gateway success, bust the products cache so the next
 *      server-side render reflects the deletion.
 *   3. NEVER touch the filesystem — the physical file under
 *      `public/uploads/...` must be preserved so the same asset can be
 *      re-attached (or remain in the media library) later.
 *
 * Replaces the older "unlink the file" tests that pinned the previous
 * (now-removed) behaviour. The old policy leaked deletes through the
 * gateway but deleted the on-disk file even if other products still
 * referenced it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("@/app/admin/_lib/with-admin", () => ({
  withAdmin: (handler: unknown) => handler,
}));

const mockRevalidateTag = vi.fn();
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const { DELETE } = await import("../[imageId]/route");

const PRODUCT_ID = "p-1";
const IMAGE_ID = "i-1";

function setupGatewayMock(opts: { status?: number; body?: unknown } = {}) {
  const status = opts.status ?? 200;
  const body = opts.body ?? { success: true };
  mockFetch.mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : (input as URL).toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "DELETE" && url.endsWith(`/api/products/${PRODUCT_ID}/images/${IMAGE_ID}`)) {
        return new Response(JSON.stringify(body), { status });
      }
      return new Response("{}", { status: 404 });
    },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockRevalidateTag.mockReset();
  mockRevalidatePath.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DELETE /admin/api/products/[id]/images/[imageId] — DB-only deletion", () => {
  it("returns ok=true on a successful gateway DELETE", async () => {
    setupGatewayMock();
    const res = await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    const body = (await (res as Response).json()) as { ok: boolean };
    expect((res as Response).status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("forwards the exact DELETE to the gateway", async () => {
    setupGatewayMock();
    await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/products/${PRODUCT_ID}/images/${IMAGE_ID}`),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("does NOT touch the filesystem (no fs.unlink calls anywhere)", async () => {
    setupGatewayMock();
    await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    // The only side effect we expect is the gateway fetch + cache bust.
    // No `fs.unlink` is imported by the route anymore.
    expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
  });

  it("busts the products cache so the next read sees the deletion", async () => {
    setupGatewayMock();
    await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    expect(mockRevalidateTag).toHaveBeenCalledWith("products");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products", "page");
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/admin/products/${PRODUCT_ID}`, "page");
  });

  it("returns ok=true with alreadyGone when the gateway responds 404", async () => {
    // The gateway returns 404 when the row was already gone (double-click,
    // another admin beat us to it, or a previous partial save). The admin
    // route converts this into a 200 envelope so the editor's optimistic
    // remove doesn't get reverted and the UI can toast "already removed".
    setupGatewayMock({ status: 404, body: { error: "Not found" } });
    const res = await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    const body = (await (res as Response).json()) as {
      ok: boolean;
      alreadyGone: boolean;
    };
    expect((res as Response).status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.alreadyGone).toBe(true);
  });

  it("still busts the cache when the row was already gone", async () => {
    setupGatewayMock({ status: 404, body: { error: "Not found" } });
    await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    expect(mockRevalidateTag).toHaveBeenCalledWith("products");
  });

  it("forwards the gateway error envelope on a non-2xx, non-404 response", async () => {
    setupGatewayMock({ status: 500, body: { error: "boom" } });
    const res = await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    const body = (await (res as Response).json()) as { error: string };
    expect((res as Response).status).toBe(500);
    expect(body.error).toBe("boom");
  });

  it("returns 502 when the gateway fetch throws (network error)", async () => {
    mockFetch.mockImplementation(async () => {
      throw new Error("ECONNREFUSED");
    });
    const res = await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    const body = (await (res as Response).json()) as { error: string };
    expect((res as Response).status).toBe(502);
    expect(body.error).toMatch(/Gateway unreachable/);
    expect(body.error).toMatch(/ECONNREFUSED/);
  });

  it("uses a generic upstream error when the gateway returns non-JSON", async () => {
    mockFetch.mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : (input as URL).toString();
        const method = (init?.method ?? "GET").toUpperCase();
        if (method === "DELETE" && url.endsWith(`/api/products/${PRODUCT_ID}/images/${IMAGE_ID}`)) {
          return new Response("upstream is down", { status: 500 });
        }
        return new Response("{}", { status: 404 });
      },
    );
    const res = await DELETE({} as never, {
      params: Promise.resolve({ id: PRODUCT_ID, imageId: IMAGE_ID }),
    } as never);
    const body = (await (res as Response).json()) as { error: string };
    expect((res as Response).status).toBe(500);
    expect(body.error).toMatch(/Upstream returned 500/);
  });
});
