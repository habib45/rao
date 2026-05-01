import { requireAdmin } from "@/app/admin/_lib/auth";
import { getSitemapStats } from "@/app/admin/_lib/queries/sitemap";
import { SitemapTabs } from "./_components/SitemapTabs";

export const metadata = { title: "Sitemap & Robots — Admin" };

export default async function SitemapPage() {
  await requireAdmin();
  const stats = await getSitemapStats();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sitemap & Robots</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.customCount} custom{" "}
            {stats.customCount === 1 ? "entry" : "entries"} ·{" "}
            {stats.exclusionCount} exclusion{stats.exclusionCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <SitemapTabs />
    </div>
  );
}
