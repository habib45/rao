import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { BlogPostForm } from "../_components/BlogPostForm";
import { gwGetActiveBlogCategories } from "@/lib/api/gateway";
import { gwGetBlogPostById } from "@/lib/api/gateway";
import type { BlogCategory, BlogPost } from "@/types/domain";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const [post, categories] = await Promise.all([
    gwGetBlogPostById(id),
    gwGetActiveBlogCategories(),
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
