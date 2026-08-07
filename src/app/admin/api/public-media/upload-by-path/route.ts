import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/app/admin/_lib/with-admin";
import { badRequest, internalError } from "@/lib/api/errors";
import fs from "fs";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
]);
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitiseFolder(folder: string): string | null {
  if (!folder) return "products";
  if (folder.includes("..") || path.isAbsolute(folder)) return null;
  const clean = folder
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
  const resolved = path.join(UPLOADS_ROOT, clean);
  if (!resolved.startsWith(UPLOADS_ROOT)) return null;
  return clean;
}

function sanitiseName(name: string): string {
  return name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

/**
 * Resolve and validate a user-supplied absolute path. The admin tool is
 * localhost-only, but we still sandbox to a configurable set of roots
 * (default `$HOME`) so a fat-fingered paste cannot overwrite arbitrary
 * files on the host. The root list is comma-separated and read from
 * `ADMIN_UPLOAD_ROOTS`; paths must resolve under one of them.
 */
function resolveAllowedPath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Reject `file://` URLs — Node's fs accepts them but the underlying
  // resolution is implementation-defined and we want a clean error.
  if (trimmed.startsWith("file://")) return null;
  // Must be absolute (POSIX or Windows).
  const isAbsolute =
    trimmed.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(trimmed);
  if (!isAbsolute) return null;
  const resolved = path.resolve(trimmed);
  const roots = (process.env.ADMIN_UPLOAD_ROOTS ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => path.resolve(r));
  // Fall back to the process user's home directory if no roots were set.
  if (roots.length === 0) {
    const home = process.env.HOME ?? process.env.USERPROFILE;
    if (home) roots.push(path.resolve(home));
  }
  // Always allow the working tree's own `public/uploads` folder — the
  // admin may legitimately want to re-import an image that was orphaned
  // from the public/uploads tree.
  roots.push(UPLOADS_ROOT);
  for (const root of roots) {
    if (resolved === root || resolved.startsWith(root + path.sep)) {
      return resolved;
    }
  }
  return null;
}

export const POST = withAdmin(async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as
    | { path?: string; folder?: string }
    | null;
  const inputPath = body?.path?.toString().trim() ?? "";
  const folder = body?.folder?.toString().trim() ?? "products";

  if (!inputPath) {
    return badRequest({ reason: "path is required" });
  }

  const safePath = resolveAllowedPath(inputPath);
  if (!safePath) {
    return badRequest({
      reason: "path must be an absolute file path under an allowed root (set ADMIN_UPLOAD_ROOTS)",
    });
  }

  let stat;
  try {
    stat = fs.statSync(safePath);
  } catch {
    return badRequest({ reason: `path not found: ${inputPath}` });
  }
  if (!stat.isFile()) {
    return badRequest({ reason: "path must point to a file" });
  }
  if (stat.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File exceeds the 10 MB size limit` },
      { status: 413 },
    );
  }

  const ext = path.extname(safePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return badRequest({ reason: `Unsupported image extension: ${ext}` });
  }

  const safeFolder = sanitiseFolder(folder);
  if (safeFolder === null) {
    return badRequest({ reason: "Invalid folder path" });
  }

  const targetDir = path.join(UPLOADS_ROOT, safeFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const baseName = sanitiseName(path.basename(safePath));
  if (!baseName) {
    return badRequest({ reason: "Invalid file name" });
  }

  // Avoid clobbering an existing file: suffix with a short random token.
  let destName = baseName;
  let destPath = path.join(targetDir, destName);
  if (fs.existsSync(destPath)) {
    const stem = baseName.replace(/\.[^.]+$/, "");
    const ext2 = ext;
    const rand = Math.random().toString(36).slice(2, 8);
    destName = `${stem}-${rand}${ext2}`;
    destPath = path.join(targetDir, destName);
  }
  if (!destPath.startsWith(UPLOADS_ROOT)) {
    return badRequest({ reason: "Invalid destination path" });
  }

  try {
    fs.copyFileSync(safePath, destPath);
  } catch (err) {
    return internalError({
      reason: err instanceof Error ? err.message : "copy failed",
    });
  }

  // We deliberately do not probe MIME (no magic-byte reader); the
  // extension check above is the trust boundary. Mime hinting for the
  // editor is best-effort.
  const mimeHint = IMAGE_MIME_TYPES.has(`image/${ext.replace(".", "")}`)
    ? `image/${ext.replace(".", "")}`
    : null;

  const publicPath = `${safeFolder}/${destName}`;
  return NextResponse.json({
    ok: true,
    paths: [`/uploads/${publicPath}`],
    mime: mimeHint,
    bytes: stat.size,
  });
});