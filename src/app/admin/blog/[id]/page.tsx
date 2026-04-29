import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { BlogPostForm } from "../_components/BlogPostForm";
import type { BlogCategory, BlogPost } from "@/types/domain";

const BLOG_SELECT = `
  *,
  blog_categories(*),
  blog_post_tags(blog_tags(*))
`;

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("blog_posts").select(BLOG_SELECT).eq("id", id).maybeSingle(),
    supabase.from("blog_categories").select("*").order("sort_order"),
  ]);

  if (!post) notFound();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Edit Blog Post</h1>
        <BlogPostForm
          post={post as unknown as BlogPost}
          categories={(categories ?? []) as unknown as BlogCategory[]}
        />
      </div>
    </AdminShell>
  );
}
