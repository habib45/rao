import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductCreateForm } from "./_components/ProductCreateForm";

export default async function NewProductPage() {
  const user = await requireAdmin();
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <ProductCreateForm categories={categories ?? []} />
    </AdminShell>
  );
}
