import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import fs from "fs";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitiseName(name: string): string {
  return name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

function sanitiseFolder(folder: string): string | null {
  if (folder.includes("..") || path.isAbsolute(folder)) return null;
  const clean = folder.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  const resolved = path.join(UPLOADS_ROOT, clean);
  if (!resolved.startsWith(UPLOADS_ROOT)) return null;
  return clean;
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const formData = await request.formData();
  const files = formData.getAll("file").filter((f) => f instanceof File) as File[];
  const folder = formData.get("folder")?.toString().trim() ?? "";

  if (files.length === 0) {
    return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
  }

  const safeFolder = sanitiseFolder(folder);
  if (safeFolder === null) {
    return NextResponse.json({ error: "Invalid folder path" }, { status: 400 });
  }

  const targetDir = path.join(UPLOADS_ROOT, safeFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const results: string[] = [];

  for (const file of files) {
    if (!IMAGE_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File "${file.name}" is not an allowed image type` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds the 10 MB size limit` },
        { status: 413 },
      );
    }

    const safeName = sanitiseName(file.name);
    if (!safeName) {
      return NextResponse.json({ error: `Invalid file name: ${file.name}` }, { status: 400 });
    }

    const destPath = path.join(targetDir, safeName);
    if (!destPath.startsWith(UPLOADS_ROOT)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(destPath, buffer);

    const publicPath = safeFolder ? `${safeFolder}/${safeName}` : safeName;
    results.push(`/uploads/${publicPath}`);
  }

  return NextResponse.json({ ok: true, paths: results });
}
