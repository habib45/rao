import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ buckets: buckets ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, public: isPublic = true } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Bucket name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.createBucket(name, {
    public: isPublic,
    allowedMimeTypes: ["image/*"],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, bucket: name });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const bucket = url.pathname.split("/").pop();

  if (!bucket) {
    return NextResponse.json({ error: "Bucket name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.deleteBucket(bucket);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}