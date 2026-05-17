import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { ProductEditForm } from "./_components/ProductEditForm";
import { getActiveCategories } from "@/lib/queries/categories";
import { gwGetProductById } from "@/lib/api/gateway";
import { notFound } from "next/navigation";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const categories = await getActiveCategories();
  const product = await gwGetProductById(id);

  if (!product) notFound();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <ProductEditForm product={product} categories={categories ?? []} />
    </AdminShell>
  );
}
