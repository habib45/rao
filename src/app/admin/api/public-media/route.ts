import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import fs from "fs";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

function sanitiseSegment(input: string): string | null {
  if (input.includes("..") || path.isAbsolute(input)) return null;
  return input.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
}

function resolveUploadsPath(folder: string): string | null {
  const safe = sanitiseSegment(folder);
  if (safe === null) return null;
  const resolved = path.join(UPLOADS_ROOT, safe);
  if (!resolved.startsWith(UPLOADS_ROOT)) return null;
  return resolved;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  const url = new URL(request.url);
  const folder = url.searchParams.get("folder")?.trim() ?? "";

  const dir = resolveUploadsPath(folder);
  if (!dir) {
    return NextResponse.json({ error: "Invalid folder path" }, { status: 400 });
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const items = entries
    .filter((e) => e.name !== ".gitkeep")
    .map((entry) => {
      const relativePath = folder ? `${folder}/${entry.name}` : entry.name;
      const isFolder = entry.isDirectory();
      const ext = path.extname(entry.name).toLowerCase();

      if (!isFolder && !IMAGE_EXTENSIONS.has(ext)) return null;

      let size: number | null = null;
      let updatedAt: string | null = null;

      if (!isFolder) {
        const stat = fs.statSync(path.join(dir, entry.name));
        size = stat.size;
        updatedAt = stat.mtime.toISOString();
      }

      return {
        name: entry.name,
        path: relativePath,
        publicUrl: isFolder ? null : `/uploads/${relativePath}`,
        size,
        sizeFormatted: size !== null ? formatSize(size) : null,
        isFolder,
        updatedAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a!.isFolder && !b!.isFolder) return -1;
      if (!a!.isFolder && b!.isFolder) return 1;
      return a!.name.localeCompare(b!.name);
    });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const url = new URL(request.url);
  const folder = url.searchParams.get("folder")?.trim() ?? "";

  const body = (await request.json()) as { folderName?: string };
  const folderName = body.folderName?.trim() ?? "";

  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(folderName)) {
    return NextResponse.json(
      { error: "Folder name must be 1–64 alphanumeric, dash, or underscore characters" },
      { status: 400 },
    );
  }

  const parentDir = resolveUploadsPath(folder);
  if (!parentDir) {
    return NextResponse.json({ error: "Invalid folder path" }, { status: 400 });
  }

  const newDir = path.join(parentDir, folderName);
  if (!newDir.startsWith(UPLOADS_ROOT)) {
    return NextResponse.json({ error: "Invalid folder path" }, { status: 400 });
  }

  fs.mkdirSync(newDir, { recursive: true });
  fs.writeFileSync(path.join(newDir, ".gitkeep"), "");

  const relativePath = folder ? `${folder}/${folderName}` : folderName;
  return NextResponse.json({ path: relativePath });
}

export async function DELETE(request: NextRequest) {
  await requireAdmin();

  const url = new URL(request.url);
  const filePath = url.searchParams.get("path")?.trim() ?? "";

  if (!filePath) {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  const safe = sanitiseSegment(filePath);
  if (!safe) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const ext = path.extname(safe).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Only image files can be deleted" }, { status: 400 });
  }

  const resolved = path.join(UPLOADS_ROOT, safe);
  if (!resolved.startsWith(UPLOADS_ROOT)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  fs.unlinkSync(resolved);
  return NextResponse.json({ ok: true });
}
