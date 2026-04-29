import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { blogViewInputSchema } from "@/app/admin/_lib/schemas/blog";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = blogViewInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  // Read current view count, then increment. Public client cannot use service-role
  // RPCs, so we do a read-then-update; the public RLS policy permits SELECT on
  // published rows, but UPDATE would be blocked unless explicitly allowed.
  // To keep this functional under public RLS we insert a row in blog_post_views
  // (allowed by RLS) and let an admin job aggregate counts. As a best-effort, we
  // still attempt to bump view_count — failures are logged but do not fail the request.
  const { data: row, error: readError } = await supabase
    .from("blog_posts")
    .select("view_count")
    .eq("id", parsed.data.postId)
    .maybeSingle();

  if (readError) {
    console.error("[blog/views POST] read", readError.message);
  }

  const currentCount =
    typeof (row as { view_count?: number } | null)?.view_count === "number"
      ? (row as { view_count: number }).view_count
      : 0;

  const { error: updateError } = await supabase
    .from("blog_posts")
    .update({ view_count: currentCount + 1 })
    .eq("id", parsed.data.postId);

  if (updateError) {
    console.error("[blog/views POST] update", updateError.message);
  }

  // Always log the view event (RLS allows public insert).
  const { error: insertError } = await supabase
    .from("blog_post_views")
    .insert({ blog_post_id: parsed.data.postId });

  if (insertError) {
    console.error("[blog/views POST] insert", insertError.message);
  }

  return NextResponse.json({ ok: true });
}
