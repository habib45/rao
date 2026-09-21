import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { productUpdateSchema } from "@/app/admin/_lib/schemas/product";
import { withAdmin, EDITOR_OR_ADMIN } from "@/app/admin/_lib/with-admin";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

type ProductImageRow = {
  id: string;
  url: string;
  width?: number | null;
  height?: number | null;
  is_primary?: boolean;
  sort_order?: number;
};

type IncomingImage = {
  id?: string;
  url: string;
  width?: number;
  height?: number;
  is_primary?: boolean;
  sort_order?: number;
};

type ImageFailure = {
  op: "delete" | "post" | "patch";
  imageId?: string;
  url: string;
  status: number;
};

type ImageDrift = {
  missing: string[];
  unexpected: string[];
};

/**
 * Drop incoming duplicate URLs, keeping the row that already has an id
 * (so a re-saved set doesn't accidentally re-create a row that survived).
 * Within a URL group, prefer the one with an id, then the lowest sort_order,
 * then the first occurrence. New URLs (no id) keep their original order.
 */
function dedupeIncoming(images: IncomingImage[]): IncomingImage[] {
  const byUrl = new Map<string, IncomingImage>();
  for (const img of images) {
    const existing = byUrl.get(img.url);
    if (!existing) {
      byUrl.set(img.url, img);
      continue;
    }
    const existingHasId = Boolean(existing.id);
    const incomingHasId = Boolean(img.id);
    const keepExisting =
      (existingHasId && !incomingHasId) ||
      (existingHasId === incomingHasId &&
        (existing.sort_order ?? 0) <= (img.sort_order ?? 0));
    if (!keepExisting) byUrl.set(img.url, img);
  }
  // Preserve the original arrival order so sort_order remains stable.
  return images.filter((img) => byUrl.get(img.url) === img);
}

async function fetchProductImages(productId: string): Promise<ProductImageRow[]> {
  try {
    const res = await fetch(`${MYSQL_API_URL}/api/products/${productId}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { images?: unknown };
    const raw = json.images;
    if (Array.isArray(raw)) return raw as ProductImageRow[];
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ProductImageRow[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  } catch {
    return [];
  }
}

export const GET = withAdmin(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = await res.json();

  // Server-side dedupe of the image list. Past save cycles may have left
  // duplicate rows pointing at the same URL; serving them raw to the form
  // triggers React's "two children with the same key" warning because the
  // form keys by URL. Collapse duplicates here and keep the row with the
  // lowest sort_order (then earliest id for stability) so the next save
  // is idempotent even if the user doesn't change anything.
  const rawImages = (json as { images?: unknown }).images;
  if (Array.isArray(rawImages)) {
    const byUrl = new Map<string, ProductImageRow>();
    for (const row of rawImages as ProductImageRow[]) {
      if (!row?.url) continue;
      const existing = byUrl.get(row.url);
      if (
        !existing ||
        (row.sort_order ?? 0) < (existing.sort_order ?? 0) ||
        ((row.sort_order ?? 0) === (existing.sort_order ?? 0) &&
          row.id < existing.id)
      ) {
        byUrl.set(row.url, row);
      }
    }
    const deduped = Array.from(byUrl.values()).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    (json as { images?: unknown }).images = deduped;
  }

  return NextResponse.json(json);
}, EDITOR_OR_ADMIN);

export const PATCH = withAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const result = productUpdateSchema.partial().safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const updateData = { ...result.data } as Record<string, unknown>;
  const rawImages = Array.isArray(updateData.images)
    ? (updateData.images as IncomingImage[])
    : undefined;
  delete updateData.images;

  // Always capture the previous image list (including any duplicates that
  // may already exist) before doing anything. We need it for the per-row
  // diff. Sort by id ascending so the "lowest-id wins" survivor rule is
  // deterministic regardless of gateway ordering.
  const previousImages = (await fetchProductImages(id)).slice().sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: (json as { error?: string }).error ?? "Gateway error" },
      { status: res.status }
    );
  }

  if (rawImages === undefined) {
    return NextResponse.json({
      ...json,
      images_partial: false,
      image_failures: [],
      image_drift: { missing: [], unexpected: [] },
    });
  }

  // ---------- image reconciliation ----------
  //
  // Strategy: diff by URL.
  //   - Keep rows whose URL is still in the incoming list. Identify them by
  //     row id so we don't accidentally touch the wrong row.
  //   - Delete only the rows whose URL is no longer in the incoming list
  //     (per-row DELETE /images/:imageId, never a blanket collection DELETE).
  //   - PATCH surviving rows whose editable metadata (order, primary flag,
  //     dimensions) changed, so reordering an existing image persists.
  //   - POST only the incoming URLs that don't already exist as a row.
  //   - Dedupe the incoming list first so two rows pointing at the same URL
  //     are collapsed before any DB write — this both prevents duplicate-key
  //     React warnings and avoids re-creating rows we just deleted.
  //   - Surface any per-row failure as `images_partial` so the UI can warn
  //     the admin instead of silently dropping rows.
  const incoming = dedupeIncoming(rawImages);
  const incomingUrls = new Set(incoming.map((i) => i.url));

  // Map of kept URLs to a surviving row id (so we can DELETE the *other*
  // rows pointing at the same URL if duplicates still exist in DB).
  const survivorByUrl = new Map<string, string>();
  for (const row of previousImages) {
    if (!survivorByUrl.has(row.url)) survivorByUrl.set(row.url, row.id);
  }

  const failures: ImageFailure[] = [];
  const drift: ImageDrift = { missing: [], unexpected: [] };
  let imagesPartial = false;

  // 1. Delete rows the admin no longer wants (and dedupe-extras in DB).
  const rowsToDelete = previousImages.filter(
    (row) => !incomingUrls.has(row.url) || survivorByUrl.get(row.url) !== row.id
  );
  for (const row of rowsToDelete) {
    try {
      const delRes = await fetch(
        `${MYSQL_API_URL}/api/products/${id}/images/${row.id}`,
        { method: "DELETE" }
      );
      if (!delRes.ok && delRes.status !== 404) {
        failures.push({
          op: "delete",
          imageId: row.id,
          url: row.url,
          status: delRes.status,
        });
      }
    } catch {
      failures.push({ op: "delete", imageId: row.id, url: row.url, status: 0 });
    }
  }

  // 2. PATCH surviving rows whose metadata changed (reorder, primary flag,
  //    dimensions). Comparing URLs alone would silently drop these edits.
  const survivingRowByUrl = new Map(
    previousImages
      .filter((row) => survivorByUrl.get(row.url) === row.id && incomingUrls.has(row.url))
      .map((row) => [row.url, row] as const)
  );
  for (const img of incoming) {
    const row = survivingRowByUrl.get(img.url);
    if (!row) continue;
    const changes: Record<string, unknown> = {};
    if ((img.sort_order ?? 0) !== (row.sort_order ?? 0)) changes.sort_order = img.sort_order ?? 0;
    if (Boolean(img.is_primary) !== Boolean(row.is_primary)) changes.is_primary = Boolean(img.is_primary);
    if (img.width !== undefined && img.width !== (row.width ?? undefined)) changes.width = img.width;
    if (img.height !== undefined && img.height !== (row.height ?? undefined)) changes.height = img.height;
    if (Object.keys(changes).length === 0) continue;
    try {
      const patchRes = await fetch(
        `${MYSQL_API_URL}/api/products/${id}/images/${row.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        }
      );
      if (!patchRes.ok) {
        failures.push({ op: "patch", imageId: row.id, url: row.url, status: patchRes.status });
      }
    } catch {
      failures.push({ op: "patch", imageId: row.id, url: row.url, status: 0 });
    }
  }

  // 3. POST only URLs that don't already have a row.
  const existingUrls = new Set(previousImages.map((r) => r.url));
  for (const img of incoming) {
    if (existingUrls.has(img.url)) continue;
    try {
      const postRes = await fetch(
        `${MYSQL_API_URL}/api/products/${id}/images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(img),
        }
      );
      if (!postRes.ok) {
        failures.push({
          op: "post",
          url: img.url,
          status: postRes.status,
        });
      }
    } catch {
      failures.push({ op: "post", url: img.url, status: 0 });
    }
  }

  // 4. Drift detection: re-fetch and compare.
  const finalImages = await fetchProductImages(id);
  const finalUrls = new Set(finalImages.map((r) => r.url));
  for (const u of incomingUrls) if (!finalUrls.has(u)) drift.missing.push(u);
  for (const u of [...finalUrls]) if (!incomingUrls.has(u)) drift.unexpected.push(u);

  const imagesPartialComputed = failures.length > 0 || drift.missing.length > 0;
  imagesPartial = imagesPartialComputed;

  if (imagesPartial) {
    console.warn("[product-images] partial reconciliation", {
      productId: id,
      failures,
      drift,
    });
  }

  // ---------- file policy ----------
  //
  // Image lifecycle: removing an image from a product only deletes the
  // DB row. The physical file under `public/uploads/...` is preserved
  // so the same asset can be re-attached (or remain in the media
  // library) later. Per-row filesystem cleanup is intentionally a no-op
  // here; nothing on disk is touched by this PATCH.
  const fileUnlink = {
    unlinked: [] as string[],
    failed: [] as Array<{ url: string; path: string; code: string }>,
    preservedShared: [] as string[],
    externalIgnored: [] as string[],
    unsafeIgnored: [] as string[],
    skipped: true as const,
  };

  // Bust the gateway-response cache so the next server-side render of
  // the product detail page (and the admin list) reflects the new image
  // set. Without this, the editor's optimistic updates would be undone
  // by a page reload returning the stale cached `product_images` array
  // (the `gw()` helper caches for 60 seconds by default).
  try {
    revalidateTag("products");
    revalidatePath("/admin/products", "page");
    revalidatePath(`/admin/products/${id}`, "page");
  } catch {
    // revalidate* throws in some non-request contexts; the DB write has
    // already succeeded, so don't fail the response on cache busting.
  }

  return NextResponse.json({
    ...json,
    images_partial: imagesPartial,
    image_failures: failures,
    image_drift: drift,
    file_unlink: fileUnlink,
  });
}, EDITOR_OR_ADMIN);

export const DELETE = withAdmin(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    revalidateTag("products");
    revalidatePath("/admin/products", "page");
  } catch {
    // Same caveat as PATCH: cache busting is best-effort.
  }

  return NextResponse.json({ ok: true });
});
