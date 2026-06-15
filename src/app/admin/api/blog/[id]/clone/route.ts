import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  // Fetch the original post
  const res = await fetch(`${MYSQL_API_URL}/api/blog/posts/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const originalPost = await res.json() as Record<string, unknown>;

  // Create a clone by removing id and modifying necessary fields
  const { id: _id, created_at: _created_at, updated_at: _updated_at, view_count: _view_count, ...cloneData } = originalPost;

  // Modify title to indicate it's a copy
  const titleEn = cloneData.title as { en?: string } | string;
  if (typeof titleEn === 'object' && titleEn.en) {
    titleEn.en = `${titleEn.en} (Copy)`;
  } else if (typeof titleEn === 'string') {
    cloneData.title = `${titleEn} (Copy)`;
  }

  // Set status to draft and remove published_at
  cloneData.status = "draft";
  delete cloneData.published_at;

  // Generate a slug from the title
  const titleStr = typeof cloneData.title === 'string' 
    ? cloneData.title 
    : (cloneData.title as { en?: string })?.en || 'untitled';
  cloneData.slug = titleStr
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-copy';

  // Ensure content is present
  if (!cloneData.content) {
    cloneData.content = { en: '' };
  }

  // Create the new post
  const createRes = await fetch(`${MYSQL_API_URL}/api/blog/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cloneData),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: errorData.error ?? "Failed to create clone" },
      { status: createRes.status },
    );
  }

  const newPost = await createRes.json() as { id?: string };
  return NextResponse.json({ id: newPost.id }, { status: 201 });
}
