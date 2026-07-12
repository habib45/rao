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

  let product;
  let loadError: string | null = null;
  try {
    product = await gwGetProductById(id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  if (!product && !loadError) notFound();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      {product ? (
        <ProductEditForm product={product} categories={categories ?? []} />
      ) : (
        <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-900">
          <h2 className="mb-2 text-base font-semibold">
            Could not load product <code className="font-mono">{id}</code>
          </h2>
          <p className="mb-2">
            The data API gateway returned an error while fetching this product.
            This is usually caused by an expired API token or the API server
            being unreachable.
          </p>
          <pre className="overflow-x-auto rounded bg-red-100 p-3 text-xs">
            {loadError}
          </pre>
          <p className="mt-4 text-xs text-red-700">
            Fix: regenerate <code>MYSQL_API_JWT_TOKEN</code> in
            <code> .env</code>, then restart <code>npm run dev</code>.
          </p>
        </div>
      )}
    </AdminShell>
  );
}
