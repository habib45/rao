/**
 * remove-orphan-uploads.ts
 *
 * When an admin removes an image from a product, the `product_images` row is
 * deleted (gateway-side) but the physical file under `public/uploads/...`
 * stays on disk. Over time this folder fills with orphans nobody can clean up.
 *
 * This helper diffs the previous and new image URL lists, identifies the URLs
 * that were dropped, and unlinks the corresponding local files under
 * `public/uploads/`. It is intentionally conservative:
 *
 *   - Only URLs that begin with `/uploads/` are considered. Anything else
 *     (Amazon CDN, third-party hosts) is left alone — those aren't our files.
 *   - The resolved path is asserted to remain inside `public/uploads/` to
 *     defeat path-traversal attempts like `/uploads/../../etc/passwd`.
 *   - An `ENOENT` (file already gone) is treated as success: race conditions
 *     and double-deletes should not surface as errors.
 *   - Cleanup runs by default. Set `FEATURE_REMOVE_ORPHAN_UPLOADS=false`
 *     as an emergency kill switch.
 *
 * Shared-file safety: pass `isUrlStillReferenced` to ask "is this URL still
 * referenced by any row in `product_images`?" — when it returns true, the
 * file is preserved. Without an oracle, ALL dropped local files are
 * unlinked (callers that don't have a gateway endpoint available accept
 * the trade-off).
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export interface RemoveOrphanInputs {
  /** URLs currently attached to the product (post-save on the gateway). */
  previous: ReadonlyArray<{ url?: string | null } | null | undefined>;
  /** URLs in the incoming PATCH payload. */
  next: ReadonlyArray<{ url?: string | null } | null | undefined>;
  /**
   * Optional URL existence oracle. Returns true if the URL is still
   * referenced by ANY row in `product_images` (across products). When
   * provided and the oracle returns true, the file is left alone.
   * When omitted, ALL local /uploads/ URLs in `removed` are unlinked.
   */
  isUrlStillReferenced?: (url: string) => Promise<boolean> | boolean;
  /**
   * Override for the upload root. Defaults to `<cwd>/public/uploads`.
   * Tests pass a tmp directory.
   */
  uploadRoot?: string;
}

export interface RemoveOrphanOutcome {
  /** URLs that were eligible but skipped because the oracle said they're still in use. */
  preservedShared: string[];
  /** Local filesystem paths that were unlinked. */
  unlinked: string[];
  /** Local filesystem paths that we tried to unlink but couldn't (non-ENOENT). */
  failed: Array<{ url: string; path: string; code: string }>;
  /** External URLs that we ignored. */
  externalIgnored: string[];
  /** URLs that didn't look safe (path traversal). */
  unsafeIgnored: string[];
}

const UPLOAD_ROOT_DEFAULT = path.join(process.cwd(), "public", "uploads");
const UPLOAD_PREFIX = "/uploads/";

/**
 * Whether orphan-upload cleanup is enabled.
 *
 * History: when this helper first shipped, the team wanted a one-release
 * safety window before files started being unlinked from disk. The flag
 * defaulted to OFF. That safety window is now over: the per-image DELETE
 * path and the PATCH reconcile path both need to actually unlink files,
 * and a flag that defaults to OFF means the bug the user just reported
 * ("delete only removes the database row, never the file") recurs.
 *
 * Policy now:
 *   - Default: enabled. When `isUrlStillReferenced` is supplied, shared
 *     files are preserved; when it is not, ALL local /uploads/ files in
 *     `removed` are unlinked (the historic "no oracle" behaviour).
 *   - Kill switch: set `FEATURE_REMOVE_ORPHAN_UPLOADS=false` to disable
 *     cleanup without redeploying. Accepts `0` and `no` (case-insensitive)
 *     in addition to `false`.
 */
export function isRemoveOrphanUploadsEnabled(): boolean {
  const raw = process.env.FEATURE_REMOVE_ORPHAN_UPLOADS;
  if (raw === undefined || raw === null || raw === "") return true;
  return !(raw === "0" || raw.toLowerCase() === "false" || raw.toLowerCase() === "no");
}

/**
 * Resolve a `/uploads/...` URL to an absolute filesystem path.
 * Returns `null` if the URL is not local, or if the resolved path
 * escapes the upload root (path traversal defense).
 */
export function resolveSafeUploadPath(url: string, root: string): string | null {
  if (!url.startsWith(UPLOAD_PREFIX)) return null;
  // Strip the prefix and decode (defense against `%2e%2e` etc.)
  let rel: string;
  try {
    rel = decodeURIComponent(url.slice(UPLOAD_PREFIX.length));
  } catch {
    return null;
  }
  if (!rel || rel.includes("\0")) return null;

  const resolved = path.resolve(root, rel);
  const rootResolved = path.resolve(root) + path.sep;
  // Must stay inside the upload root. Also block absolute paths inside `rel`.
  if (!resolved.startsWith(rootResolved) && resolved !== path.resolve(root)) {
    return null;
  }
  // Disallow symlinks that resolve outside the root.
  return resolved;
}

/**
 * Diff previous vs. next and unlink the dropped local files.
 * Pure (apart from filesystem writes); safe to call from a route handler.
 */
export async function removeOrphanUploads(
  inputs: RemoveOrphanInputs
): Promise<RemoveOrphanOutcome> {
  const outcome: RemoveOrphanOutcome = {
    preservedShared: [],
    unlinked: [],
    failed: [],
    externalIgnored: [],
    unsafeIgnored: [],
  };

  const root = inputs.uploadRoot ?? UPLOAD_ROOT_DEFAULT;
  const previousUrls = new Set(
    inputs.previous
      .map((row) => (row && typeof row.url === "string" ? row.url : null))
      .filter((u): u is string => !!u)
  );
  const nextUrls = new Set(
    inputs.next
      .map((row) => (row && typeof row.url === "string" ? row.url : null))
      .filter((u): u is string => !!u)
  );

  for (const url of previousUrls) {
    if (nextUrls.has(url)) continue;
    if (!url.startsWith(UPLOAD_PREFIX)) {
      outcome.externalIgnored.push(url);
      continue;
    }
    const resolved = resolveSafeUploadPath(url, root);
    if (!resolved) {
      outcome.unsafeIgnored.push(url);
      continue;
    }
    if (inputs.isUrlStillReferenced) {
      const stillUsed = await inputs.isUrlStillReferenced(url);
      if (stillUsed) {
        outcome.preservedShared.push(url);
        continue;
      }
    }
    try {
      await fs.unlink(resolved);
      outcome.unlinked.push(resolved);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code ?? "UNKNOWN";
      if (code === "ENOENT") continue; // already gone; idempotent
      outcome.failed.push({ url, path: resolved, code });
    }
  }

  return outcome;
}
