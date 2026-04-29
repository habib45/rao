import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { BlogPostsTable } from "./_components/BlogPostsTable";

export default async function AdminBlogPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Blog Posts</h1>
          <div className="flex gap-2">
            <Link
              href="/admin/blog/categories"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border/50"
            >
              <Tag className="h-4 w-4" />
              Categories
            </Link>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" />
              New Post
            </Link>
          </div>
        </div>
        <BlogPostsTable />
      </div>
    </AdminShell>
  );
}
