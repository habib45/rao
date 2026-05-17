import { Package, FolderTree, MousePointerClick, TrendingUp } from "lucide-react";
import { requireAdmin } from "@/app/admin/_lib/auth";
import {
  getDashboardStats,
  getClickTrends,
  getTopCategories,
  getRecentSyncLogs,
  getTopProducts,
  getScheduledProducts,
} from "@/app/admin/_lib/queries/dashboard";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { StatsCard } from "@/app/admin/_components/dashboard/StatsCard";
import { SyncStatusTable } from "@/app/admin/_components/dashboard/SyncStatusTable";
import { AsinImportWidget } from "@/app/admin/_components/dashboard/AsinImportWidget";
import { ScheduledPublishWidget } from "@/app/admin/_components/dashboard/ScheduledPublishWidget";
import { ClickTrendsChart } from "@/app/admin/_components/charts/ClickTrendsChart";
import { TopCategoriesChart } from "@/app/admin/_components/charts/TopCategoriesChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/admin/_components/ui/card";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const [stats, clickTrends, topCategories, syncLogs, topProducts, scheduledProducts] =
    await Promise.all([
      getDashboardStats(),
      getClickTrends(30),
      getTopCategories(5),
      getRecentSyncLogs(5),
      getTopProducts(5),
      getScheduledProducts(10),
    ]);

  const categoryChartData = topCategories.map((c) => ({
    name: c.category_name?.en ?? "Unknown",
    click_count: Number(c.click_count),
  }));

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Products"
            value={Number(stats.total_products)}
            icon={Package}
            description={`${stats.active_products} active`}
          />
          <StatsCard
            title="Categories"
            value={Number(stats.total_categories)}
            icon={FolderTree}
            description={`${stats.active_categories} active`}
          />
          <StatsCard
            title="Clicks (7d)"
            value={Number(stats.clicks_7d)}
            icon={MousePointerClick}
          />
          <StatsCard
            title="Clicks (30d)"
            value={Number(stats.clicks_30d)}
            icon={TrendingUp}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Click Trends (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ClickTrendsChart data={clickTrends} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <TopCategoriesChart data={categoryChartData} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted">No click data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div
                      key={p.asin}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-medium text-muted">
                          {i + 1}
                        </span>
                        <span className="font-medium">{p.name?.en || "Unknown"}</span>
                      </div>
                      <span className="text-muted">{p.click_count} clicks</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Status</CardTitle>
            </CardHeader>
            <CardContent>
              <SyncStatusTable logs={syncLogs} />
            </CardContent>
          </Card>
        </div>

        {/* Ingestion + scheduling row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AsinImportWidget />

          <Card>
            <CardHeader>
              <CardTitle>Scheduled for Publishing</CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduledPublishWidget products={scheduledProducts} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
