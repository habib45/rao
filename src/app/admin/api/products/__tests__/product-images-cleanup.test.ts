/**
 * Tests for the file-lifecycle contract of
 * PATCH `/admin/api/products/[id]`.
 *
 * Policy pinned here (intentional change): removing an image from a
 * product now only deletes the DB row. The physical file under
 * `public/uploads/...` is preserved so the same asset can be re-attached
 * (or remain in the media library) later. This file asserts that:
 *   - `removeOrphanUploads` is NEVER invoked from the PATCH route.
 *   - `file_unlink.skipped === true` is always returned.
 *   - Cache invalidation tags / paths are honoured on success.
 *
 * This replaces the older "default-on" cleanup tests that pinned the
 * previous behaviour. The sibling `product-images-reconcile.test.ts`
 * pins the URL-diff contract.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());
const mockRemoveOrphanUploads = vi.hoisted(() => vi.fn());

vi.mock("@/lib/uploads/remove-orphan-uploads", () => ({
  isRemoveOrphanUploadsEnabled: () => true,
  removeOrphanUploads: mockRemoveOrphanUploads,
  resolveSafeUploadPath: () => null,
}));

vi.mock("@/lib/uploads/is-product-image-url-referenced", () => ({
  isProductImageUrlReferenced: vi.fn(async () => false),
  __resetIsProductImageUrlReferencedCache: () => {},
}));

const mockRevalidateTag = vi.fn();
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/app/admin/_lib/with-admin", () => ({
  withAdmin: (handler: unknown) => handler,
  EDITOR_OR_ADMIN: { role: ["admin", "editor"] },
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

function setupGatewayMock(opts: {
  previous?: Array<{ id: string; url: string; sort_order: number }>;
  postReconcile?: Array<{ id: string; url: string; sort_order: number }>;
} = {}) {
  const previous = opts.previous ?? [];
  const postReconcile = opts.postReconcile ?? previous;
  let getCalls = 0;
  mockFetch.mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : (input as URL).toString();
      const method = (init?.method ?? "GET").toUpperCase();

      if (method === "GET" && url.endsWith(`/api/products/${PRODUCT_ID}`)) {
        getCalls += 1;
        const images = getCalls === 1 ? previous : postReconcile;
        return new Response(JSON.stringify({ id: PRODUCT_ID, images }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (method === "PATCH" && url.endsWith(`/api/products/${PRODUCT_ID}`)) {
        return new Response(JSON.stringify({ id: PRODUCT_ID }), { status: 200 });
      }

      const delMatch = url.match(
        new RegExp(`/api/products/${PRODUCT_ID}/images/([^/?]+)$`),
      );
      if (method === "DELETE" && delMatch) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      if (method === "POST" && url.endsWith(`/api/products/${PRODUCT_ID}/images`)) {
        const body = JSON.parse((init?.body as string) ?? "{}");
        return new Response(JSON.stringify({ id: "new", ...body }), { status: 201 });
      }

      return new Response("{}", { status: 404 });
    },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockRemoveOrphanUploads.mockReset();
  mockRevalidateTag.mockReset();
  mockRevalidatePath.mockReset();
  process.env.FEATURE_REMOVE_ORPHAN_UPLOADS = "true";
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PATCH /admin/api/products/[id] — file-lifecycle (no fs writes)", () => {
  it("never invokes removeOrphanUploads during the PATCH", async () => {
    setupGatewayMock({
      previous: [{ id: "old", url: "/uploads/products/apple.png", sort_order: 0 }],
    });

    const res = await PATCH(
      jsonRequest({ images: [{ url: "https://x/new.jpg" }] }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );

    expect((res as Response).status).toBe(200);
    expect(mockRemoveOrphanUploads).not.toHaveBeenCalled();
  });

  it("returns file_unlink.skipped=true regardless of FEATURE_REMOVE_ORPHAN_UPLOADS", async () => {
    setupGatewayMock({
      previous: [{ id: "old", url: "/uploads/products/keep.png", sort_order: 0 }],
    });

    const res = await PATCH(
      jsonRequest({ images: [{ url: "https://x/new.jpg" }] }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );
    const body = (await (res as Response).json()) as {
      file_unlink: { skipped: true };
    };

    expect(body.file_unlink.skipped).toBe(true);
  });

  it("busts the products cache so the next read sees the new image set", async () => {
    setupGatewayMock({
      previous: [{ id: "old", url: "https://x/old.jpg", sort_order: 0 }],
    });

    await PATCH(
      jsonRequest({ images: [{ url: "https://x/new.jpg", sort_order: 0 }] }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );

    expect(mockRevalidateTag).toHaveBeenCalledWith("products");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products", "page");
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      `/admin/products/${PRODUCT_ID}`,
      "page",
    );
  });

  it("does not escalate images_partial when an orphan would have failed", async () => {
    // The old behaviour used to set images_partial=true and append a
    // synthetic delete failure when removeOrphanUploads reported a
    // non-ENOENT error. With the new policy the filesystem is never
    // touched, so these failure surfaces no longer exist.
    setupGatewayMock({
      previous: [],
      postReconcile: [{ id: "new", url: "https://x/a.jpg", sort_order: 0 }],
    });

    const res = await PATCH(
      jsonRequest({
        images: [{ url: "https://x/a.jpg", sort_order: 0 }],
      }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );
    const body = (await (res as Response).json()) as {
      images_partial: boolean;
      image_failures: Array<{ op: string; url: string; status: number }>;
    };

    expect(body.images_partial).toBe(false);
    expect(body.image_failures).toEqual([]);
  });

  it("does not touch the filesystem even when FEATURE_REMOVE_ORPHAN_UPLOADS=true", async () => {
    setupGatewayMock({
      previous: [{ id: "old", url: "/uploads/products/x.png", sort_order: 0 }],
    });

    await PATCH(
      jsonRequest({ images: [{ url: "https://x/new.jpg" }] }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );

    expect(mockRemoveOrphanUploads).not.toHaveBeenCalled();
  });

  it("ignores the kill switch (no flag matters anymore — files are always preserved)", async () => {
    process.env.FEATURE_REMOVE_ORPHAN_UPLOADS = "false";
    setupGatewayMock({
      previous: [{ id: "old", url: "/uploads/products/keep.png", sort_order: 0 }],
    });

    const res = await PATCH(
      jsonRequest({ images: [{ url: "https://x/new.jpg" }] }) as never,
      { params: Promise.resolve({ id: PRODUCT_ID }) } as never,
    );
    const body = (await (res as Response).json()) as {
      file_unlink: { skipped: boolean };
    };

    expect((res as Response).status).toBe(200);
    expect(body.file_unlink.skipped).toBe(true);
    expect(mockRemoveOrphanUploads).not.toHaveBeenCalled();
  });
});
