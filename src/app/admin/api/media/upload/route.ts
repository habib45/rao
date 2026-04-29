import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

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

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("file").filter((item) => item instanceof File) as File[];
  const path = formData.get("path")?.toString().trim() ?? "";
  const bucket = formData.get("bucket")?.toString().trim() ?? "media";

  if (files.length === 0) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  await ensureBucket(supabase, bucket);

  const results = await Promise.all(
    files.map(async (file) => {
      const filePath = path ? `${path}/${file.name}` : file.name;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        upsert: true,
      });
      return { filePath, error };
    }),
  );

  const uploadError = results.find((result) => result.error);
  if (uploadError?.error) {
    return NextResponse.json({ error: uploadError.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, paths: results.map((result) => result.filePath) });
}
