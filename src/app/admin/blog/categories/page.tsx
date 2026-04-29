import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { BlogCategoriesClient } from "./_components/BlogCategoriesClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BlogCategoriesPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Blog Posts
            </Link>
            <span className="text-muted">/</span>
            <h1 className="text-2xl font-semibold">Blog Categories</h1>
          </div>
        </div>
        <BlogCategoriesClient />
      </div>
    </AdminShell>
  );
}
