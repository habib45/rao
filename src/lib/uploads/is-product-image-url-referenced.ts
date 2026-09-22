/**
 * is-product-image-url-referenced.ts
 *
 * Oracle: "is this URL still referenced by any row in `product_images`?"
 *
 * Used by the per-image DELETE route and the PATCH reconcile flow to
 * decide whether a local file under /uploads/ is safe to unlink. Without
 * this oracle the safer choice is to keep the file (false negative),
 * which is the policy the orphan helper has always followed when an
 * oracle isn't supplied.
 *
 * The oracle is "best-effort, fail-closed": if the gateway is unreachable
 * or returns an unexpected response, we treat the URL as still referenced
 * (return `true`). That means the file is preserved. The trade-off matches
 * the underlying filesystem operation: unlink is irreversible, so we would
 * rather leak a file than delete a shared one.
 *
 * The wrapper caches results per process so that a single PATCH diff over
 * many URLs only hits the gateway once per URL.
 */

import { MYSQL_API_URL } from "@/lib/config/datasource";

export interface IsProductImageUrlReferencedOptions {
  /**
   * Optional product id to exclude from the lookup. The PATCH reconcile
   * passes the product id being saved so that the "removed" URL set
   * doesn't pollute the oracle answer.
   */
  excludeProductId?: string;
  /**
   * Test-seam: replace the underlying fetch. Defaults to global `fetch`.
   */
  fetcher?: typeof fetch;
  /**
   * Test-seam: override the gateway base URL.
   */
  gatewayUrl?: string;
}

const cache = new Map<string, boolean>();

function cacheKey(url: string, excludeProductId: string | undefined): string {
  return excludeProductId ? `${excludeProductId}::${url}` : `::${url}`;
}

export async function isProductImageUrlReferenced(
  url: string,
  options: IsProductImageUrlReferencedOptions = {},
): Promise<boolean> {
  if (!url) return true; // fail-closed for empty input
  const key = cacheKey(url, options.excludeProductId);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const fetcher = options.fetcher ?? fetch;
  const base = options.gatewayUrl ?? MYSQL_API_URL ?? "http://localhost:4000";

  try {
    const params = new URLSearchParams({ url });
    if (options.excludeProductId) {
      params.set("exclude_product_id", options.excludeProductId);
    }
    const res = await fetcher(`${base}/api/products/images/by-url?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      // Fail-closed: assume still referenced, leave the file alone.
      cache.set(key, true);
      return true;
    }
    const body = (await res.json()) as { referenced?: boolean };
    const referenced = Boolean(body?.referenced);
    cache.set(key, referenced);
    return referenced;
  } catch {
    cache.set(key, true);
    return true;
  }
}

/**
 * Test-only: clear the in-process cache. Used by tests that swap the
 * gateway URL or fetcher between assertions.
 */
export function __resetIsProductImageUrlReferencedCache(): void {
  cache.clear();
}
