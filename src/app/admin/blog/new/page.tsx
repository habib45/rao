import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { BlogPostForm } from "../_components/BlogPostForm";
import { gwGetActiveBlogCategories } from "@/lib/api/gateway";
import type { BlogCategory } from "@/types/domain";

export default async function NewBlogPostPage() {
  const user = await requireAdmin();
  const categories = await gwGetActiveBlogCategories();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">New Blog Post</h1>
        <BlogPostForm
          post={null}
          categories={(categories ?? []) as unknown as BlogCategory[]}
        />
      </div>
    </AdminShell>
  );
}
