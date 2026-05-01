"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Button } from "@/app/admin/_components/ui/button";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

type PreviewEntry = {
  url: string;
  type: string;
  lastModified: string | null;
  priority: number;
};

const TYPE_COLORS: Record<string, string> = {
  product: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  category: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  blog_post: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  blog_category: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  static: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  custom: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const PAGE_SIZE = 50;

export function SitemapPreviewTable() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [urlFilter, setUrlFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sitemap-preview", page],
    queryFn: async () => {
      const res = await fetch(`/admin/api/sitemap?action=preview&page=${page}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to load preview");
      return res.json() as Promise<{ entries: PreviewEntry[]; total: number }>;
    },
  });

  const filtered = (data?.entries ?? []).filter((e) => {
    const matchType = typeFilter ? e.type === typeFilter : true;
    const matchUrl = urlFilter ? e.url.toLowerCase().includes(urlFilter.toLowerCase()) : true;
    return matchType && matchUrl;
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filter by URL…"
          value={urlFilter}
          onChange={(e) => setUrlFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 w-64"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
        >
          <option value="">All types</option>
          {["product", "category", "blog_post", "blog_category", "static", "custom"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-sm text-muted ml-auto">
          {data?.total ?? 0} total entries
        </span>
        <a
          href="/sitemap.xml"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
        >
          Open sitemap.xml <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">URL</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Last Modified</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-72" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                  </tr>
                ))
              : filtered.map((entry, i) => (
                  <tr key={i} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono text-xs text-foreground max-w-xs truncate">
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-brand hover:underline"
                        title={entry.url}
                      >
                        {entry.url}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[entry.type] ?? ""}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {entry.lastModified
                        ? new Date(entry.lastModified).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{entry.priority}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
