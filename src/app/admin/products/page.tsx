import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { ProductsTable } from "./_components/ProductsTable";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminProductsPage() {
  const user = await requireAdmin();
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <ProductsTable categories={categories ?? []} />
      </div>
    </AdminShell>
  );
}
