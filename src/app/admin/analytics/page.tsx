import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { getAllProducts } from "@/lib/queries/products";
import { AnalyticsTabs } from "./_components/AnalyticsTabs";

export default async function AdminAnalyticsPage() {
  const user = await requireAdmin();
  const products = await getAllProducts();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <AnalyticsTabs products={products ?? []} />
      </div>
    </AdminShell>
  );
}
