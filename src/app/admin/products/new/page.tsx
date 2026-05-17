import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { getActiveCategories } from "@/lib/queries/categories";
import { ProductCreateForm } from "./_components/ProductCreateForm";

export default async function NewProductPage() {
  const user = await requireAdmin();
  const categories = await getActiveCategories();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <ProductCreateForm categories={categories ?? []} />
    </AdminShell>
  );
}
