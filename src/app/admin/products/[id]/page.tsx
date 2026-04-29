import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { ProductEditForm } from "./_components/ProductEditForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*, product_images(*)").eq("id", id).single(),
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  if (!product) notFound();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <ProductEditForm product={product} categories={categories ?? []} />
    </AdminShell>
  );
}
