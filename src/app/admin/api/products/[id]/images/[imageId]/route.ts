import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin } from "@/app/admin/_lib/with-admin";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export const DELETE = withAdmin(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) => {
  const { id, imageId } = await params;

  // Policy: deleting an image from a product only removes the DB row.
  // The physical file under `public/uploads/...` is preserved so the
  // same asset can be re-attached (or remain in the media library) later.

  // Forward the DELETE to the upstream gateway. We wrap the call in a
  // try/catch so a network-level failure (gateway unreachable,
  // ECONNREFUSED, DNS error, request aborted, etc.) returns a proper
  // 502 Bad Gateway envelope to the client instead of a generic 500
  // with no body — otherwise the admin sees a confusing "Failed to
  // delete image" toast with no indication that the upstream is down,
  // and the image they thought they removed quietly stays in the DB.
  let res: Response;
  try {
    res = await fetch(
      `${MYSQL_API_URL}/api/products/${id}/images/${imageId}`,
      { method: "DELETE" },
    );
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Upstream gateway unreachable";
    console.error("[delete-image] gateway fetch threw", { id, imageId, reason });
    return NextResponse.json(
      { error: `Gateway unreachable: ${reason}` },
      { status: 502 },
    );
  }

  if (!res.ok) {
    // 404 from the gateway means the row was already gone (double-click
    // on the X button, another admin beat us to it, or the row was
    // orphaned by a previous partial save). Treat that as a successful
    // no-op so the editor's optimistic remove doesn't get reverted —
    // and surface a dedicated `alreadyGone` flag so the UI can toast a
    // friendlier "already removed" message instead of an error.
    if (res.status === 404) {
      try {
        revalidateTag("products");
        revalidatePath("/admin/products", "page");
        revalidatePath(`/admin/products/${id}`, "page");
      } catch {
        // cache busting is best-effort; the row is already absent.
      }
      return NextResponse.json({ ok: true, alreadyGone: true });
    }
    // For any other non-2xx (500, 502, etc.) forward the upstream
    // envelope so the client can surface a useful message.
    let upstreamBody: unknown = null;
    try {
      upstreamBody = await res.json();
    } catch {
      // gateway returned a non-JSON body; leave upstreamBody as null.
    }
    return NextResponse.json(
      {
        error:
          (upstreamBody as { error?: string } | null)?.error ??
          `Upstream returned ${res.status}`,
      },
      { status: res.status },
    );
  }

  // Bust the gateway-response cache so the next server-side render of
  // the product detail page (and the admin list) reflects the deletion.
  // Without this, the editor's optimistic remove would be undone by a
  // page reload returning the stale cached `product_images` array.
  try {
    revalidateTag("products");
    revalidatePath("/admin/products", "page");
    revalidatePath(`/admin/products/${id}`, "page");
  } catch {
    // revalidate* throws in some non-request contexts; the DB row is
    // already gone, so don't fail the response on cache invalidation.
  }

  return NextResponse.json({ ok: true });
});
