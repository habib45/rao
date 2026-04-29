import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { blogCommentInputSchema } from "@/app/admin/_lib/schemas/blog";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = blogCommentInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("blog_comments").insert({
    blog_post_id: parsed.data.postId,
    author_name: parsed.data.authorName,
    author_email: parsed.data.authorEmail,
    body: parsed.data.body,
    is_approved: false,
  });

  if (error) {
    console.error("[blog/comments POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
