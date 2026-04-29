import Link from "next/link";
import { Plus } from "lucide-react";
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Products</h1>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </div>
        <ProductsTable categories={categories ?? []} />
      </div>
    </AdminShell>
  );
}
