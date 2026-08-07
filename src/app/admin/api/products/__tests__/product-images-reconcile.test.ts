/**
 * Phase 11 / Phase 13 — Product image reconciliation tests.
 *
 * The PATCH `/admin/api/products/[id]` route now does a URL-diff reconcile:
 *   - DELETE rows whose URL is no longer in the incoming list
 *   - POST only URLs that don't already exist as a row
 *   - Surface per-row failures + drift via `images_partial` / `image_failures` / `image_drift`
 *   - Run `removeOrphanUploads()` for dropped /uploads/* files (default on)
 *   - Surface the cleanup result via `file_unlink`
 *
 * These tests pin that contract. Run with `npx vitest run`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/uploads/remove-orphan-uploads", () => ({
  isRemoveOrphanUploadsEnabled: () => false,
  removeOrphanUploads: vi.fn(async () => ({
    preservedShared: [],
    unlinked: [],
    failed: [],
    externalIgnored: [],
    unsafeIgnored: [],
  })),
}));

vi.mock("@/app/admin/_lib/with-admin", () => ({
  withAdmin: (handler: unknown) => handler,
}));

import { PATCH } from "../[id]/route";

const PRODUCT_ID = "11111111-2222-3333-4444-555555555555";

function jsonRequest(body: unknown): Request {
  return new Request(`http://localhost/admin/api/products/${PRODUCT_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Configurable mock for the MySQL API gateway. */
function setupGatewayMock(opts: {
  previous?: Array<{ id: string; url: string; sort_order: number }>;
  patchResponse?: unknown;
  deleteOkFor?: Set<string>;
  postOkFor?: Set<string>;
}) {
  const previous = opts.previous ?? [];
  const patchResponse = opts.patchResponse ?? { id: PRODUCT_ID };
  const deleteOk = opts.deleteOkFor;
  const postOk = opts.postOkFor;

  mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as URL).toString();
    const method = (init?.method ?? "GET").toUpperCase();

    // Read current product images (twice: pre + post diff).
    if (method === "GET" && url.endsWith(`/api/products/${PRODUCT_ID}`)) {
      return new Response(JSON.stringify({ id: PRODUCT_ID, images: previous }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // PATCH main product fields.
    if (method === "PATCH" && url.endsWith(`/api/products/${PRODUCT_ID}`)) {
      return new Response(JSON.stringify(patchResponse), { status: 200 });
    }

    // Per-image DELETE.
    const delMatch = url.match(new RegExp(`/api/products/${PRODUCT_ID}/images/([^/?]+)$`));
    if (method === "DELETE" && delMatch) {
      const id = delMatch[1]!;
      const ok = deleteOk ? deleteOk.has(id) : true;
      return new Response(JSON.stringify({ ok }), {
        status: ok ? 200 : 500,
      });
    }

    // POST new image.
    if (method === "POST" && url.endsWith(`/api/products/${PRODUCT_ID}/images`)) {
      const body = JSON.parse((init?.body as string) ?? "{}");
      const ok = postOk ? postOk.has(body.url) : true;
      if (!ok) {
        return new Response(JSON.stringify({ error: "gateway rejected" }), { status: 502 });
      }
      return new Response(JSON.stringify({ id: "new-" + body.url, ...body }), {
        status: 201,
      });
    }

    return new Response("{}", { status: 404 });
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.FEATURE_REMOVE_ORPHAN_UPLOADS = "false";
  // Install the mock as the global fetch the route uses.
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PATCH /admin/api/products/[id] — image reconciliation", () => {
  it("passes through unchanged when no images in payload", async () => {
    setupGatewayMock({ previous: [{ id: "a", url: "https://x/a.jpg", sort_order: 0 }] });

    const res = await PATCH(
      jsonRequest({ name: { en: "x" }, price_cents: 100, currency: "USD" }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );
    const body = (await (res as Response).json()) as Record<string, unknown>;

    expect((res as Response).status).toBe(200);
    expect(body.images_partial).toBe(false);
    expect(body.image_failures).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/images\/[^/]+$/),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("deletes rows whose URL is no longer in payload", async () => {
    setupGatewayMock({
      previous: [
        { id: "keep", url: "https://x/a.jpg", sort_order: 0 },
        { id: "drop", url: "https://x/b.jpg", sort_order: 1 },
      ],
    });

    const res = await PATCH(
      jsonRequest({
        images: [{ url: "https://x/a.jpg", is_primary: true, sort_order: 0 }],
      }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );

    expect(res.status).toBe(200);
    const deleteCalls = mockFetch.mock.calls.filter(
      ([u, init]) =>
        typeof u === "string" &&
        (u as string).endsWith("/images/drop") &&
        (((init as RequestInit | undefined)?.method ?? "GET") as string).toUpperCase() === "DELETE",
    );
    expect(deleteCalls).toHaveLength(1);
  });

  it("posts only URLs that are not already in the DB", async () => {
    setupGatewayMock({
      previous: [{ id: "a", url: "https://x/a.jpg", sort_order: 0 }],
    });

    await PATCH(
      jsonRequest({
        images: [
          { url: "https://x/a.jpg", is_primary: true, sort_order: 0 },
          { url: "https://x/new.jpg", is_primary: false, sort_order: 1 },
        ],
      }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );

    const postCalls = mockFetch.mock.calls.filter(
      ([u, init]) =>
        typeof u === "string" &&
        (u as string).endsWith("/images") &&
        (((init as RequestInit | undefined)?.method ?? "GET") as string).toUpperCase() === "POST",
    );
    expect(postCalls).toHaveLength(1);
  });

  it("collapses duplicate incoming URLs before writing", async () => {
    setupGatewayMock({ previous: [] });

    await PATCH(
      jsonRequest({
        images: [
          { url: "https://x/dup.jpg", sort_order: 0 },
          { url: "https://x/dup.jpg", sort_order: 1 },
          { url: "https://x/other.jpg", sort_order: 2 },
        ],
      }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );

    const postBodies = mockFetch.mock.calls
      .filter(
        ([u, init]) =>
          typeof u === "string" &&
          (u as string).endsWith("/images") &&
          (((init as RequestInit | undefined)?.method ?? "GET") as string).toUpperCase() === "POST",
      )
      .map(([, init]) => JSON.parse(((init as RequestInit).body as string) ?? "{}"));

    expect(postBodies.map((b) => b.url)).toEqual(["https://x/dup.jpg", "https://x/other.jpg"]);
  });

  it("returns images_partial when a single per-row delete fails", async () => {
    setupGatewayMock({
      previous: [
        { id: "ok", url: "https://x/ok.jpg", sort_order: 0 },
        { id: "bad", url: "https://x/bad.jpg", sort_order: 1 },
      ],
      deleteOkFor: new Set(["ok"]), // "bad" returns 500
    });

    const res = await PATCH(
      jsonRequest({
        images: [{ url: "https://x/ok.jpg", is_primary: true, sort_order: 0 }],
      }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );

    const body = (await (res as Response).json()) as {
      images_partial: boolean;
      image_failures: Array<{ op: string; status: number }>;
    };
    expect(body.images_partial).toBe(true);
    expect(body.image_failures).toEqual([
      expect.objectContaining({ op: "delete", status: 500 }),
    ]);
  });

  it("keeps duplicate DB rows pointed at the same URL only on the lowest id", async () => {
    setupGatewayMock({
      previous: [
        { id: "second", url: "https://x/dup.jpg", sort_order: 1 },
        { id: "first", url: "https://x/dup.jpg", sort_order: 0 },
      ],
    });

    await PATCH(
      jsonRequest({
        images: [{ url: "https://x/dup.jpg", sort_order: 0 }],
      }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );

    const deleteIds = mockFetch.mock.calls
      .filter(([u, init]) => {
        if (typeof u !== "string") return false;
        if (!(u as string).includes("/images/")) return false;
        return (((init as RequestInit | undefined)?.method ?? "GET") as string).toUpperCase() === "DELETE";
      })
      .map(([u]) => (u as string).split("/").pop());

    // Second row ("second") should be deleted; "first" preserved.
    expect(deleteIds).toEqual(["second"]);
  });
});
