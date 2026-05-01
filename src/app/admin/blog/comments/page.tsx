import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { CommentsTable } from "./_components/CommentsTable";

export default async function AdminBlogCommentsPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Blog Comments</h1>
        <CommentsTable />
      </div>
    </AdminShell>
  );
}
