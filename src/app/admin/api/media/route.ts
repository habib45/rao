import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

function getPathFromUrl(url: URL) {
  return url.searchParams.get("path")?.trim() ?? "";
}

function getBucketFromUrl(url: URL) {
  return url.searchParams.get("bucket")?.trim() ?? "media";
}

async function ensureBucket(supabase: SupabaseAdmin, bucket: string) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.id === bucket);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ["image/*"],
        fileSizeLimit: 10 * 1024 * 1024,
      });
      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error("Failed to ensure bucket:", error);
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = getPathFromUrl(url);
  const bucket = getBucketFromUrl(url);
  const supabase = createAdminClient();

  await ensureBucket(supabase, bucket);

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, { limit: 200, offset: 0, sortBy: { column: "name", order: "asc" } });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((entry) => {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    const isFolder = entry.metadata === null;
    const publicUrl = isFolder
      ? null
      : supabase.storage.from(bucket).getPublicUrl(entryPath).data.publicUrl;

    return {
      name: entry.name,
      path: entryPath,
      size: (entry.metadata as { size?: number } | null)?.size ?? null,
      createdAt: entry.created_at ?? null,
      updatedAt: entry.updated_at ?? null,
      isFolder,
      publicUrl,
    };
  });

  return NextResponse.json({ items });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const path = getPathFromUrl(url);
  const bucket = getBucketFromUrl(url);

  if (!path) {
    return NextResponse.json({ error: "Path is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
