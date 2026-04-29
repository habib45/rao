import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnalyticsTabs } from "./_components/AnalyticsTabs";

export default async function AdminAnalyticsPage() {
  const user = await requireAdmin();
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, asin")
    .eq("is_active", true)
    .order("name->en")
    .limit(500);

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <AnalyticsTabs products={products ?? []} />
      </div>
    </AdminShell>
  );
}
