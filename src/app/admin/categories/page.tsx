import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { CategoriesTable } from "./_components/CategoriesTable";

export default async function AdminCategoriesPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <CategoriesTable />
      </div>
    </AdminShell>
  );
}
