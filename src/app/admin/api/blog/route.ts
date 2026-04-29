import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { blogPostInputSchema } from "@/app/admin/_lib/schemas/blog";
import { syncPostTags } from "@/app/admin/_lib/blog-tags";

const BLOG_SELECT = `
  *,
  blog_categories(id, name, slug, color),
  blog_post_tags(blog_tags(id, name, slug))
`;

export async function GET() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/blog GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json().catch(() => null);
  const parsed = blogPostInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { tag_names, published_at, ...rest } = parsed.data;

  const insertPayload: Record<string, unknown> = { ...rest };

  if (rest.status === "published") {
    insertPayload.published_at = published_at ?? new Date().toISOString();
  } else if (published_at !== undefined) {
    insertPayload.published_at = published_at;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("[admin/blog POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (tag_names && tag_names.length > 0) {
    await syncPostTags(data.id, tag_names);
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
