"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, AlertTriangle, Trash2, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";
import { extractSlugFromUrl, isDevelopmentUrl } from "@/lib/sitemap/utils";

type PreviewEntry = {
  url: string;
  type: string;
  lastModified: string | null;
  priority: number;
};

type Props = {
  currentBaseUrl?: string;
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

export function SitemapPreviewTable({ currentBaseUrl }: Props) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [urlFilter, setUrlFilter] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [showDeleteMode, setShowDeleteMode] = useState(false);

  const isDevUrl = currentBaseUrl ? isDevelopmentUrl(currentBaseUrl) : false;

  const { data, isLoading } = useQuery({
    queryKey: ["sitemap-preview", page],
    queryFn: async () => {
      const res = await fetch(`/admin/api/sitemap?action=preview&page=${page}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to load preview");
      return res.json() as Promise<{ entries: PreviewEntry[]; total: number }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (urls: string[]) => {
      // Extract slugs from URLs
      const slugs = urls.map(extractSlugFromUrl).filter((slug): slug is string => slug !== null);
      
      if (slugs.length === 0) {
        throw new Error("No valid slugs could be extracted from URLs");
      }
      
      const res = await fetch("/admin/api/sitemap/exclusions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: slugs }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete URLs");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      const deletedCount = data.added || 0;
      toast.success(`${deletedCount} URL(s) deleted from sitemap`);
      setSelectedUrls(new Set());
      setShowDeleteMode(false);
      qc.invalidateQueries({ queryKey: ["sitemap-preview"] });
      qc.invalidateQueries({ queryKey: ["sitemap-exclusions"] });
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete URLs");
    },
  });

  const singleDeleteMutation = useMutation({
    mutationFn: async (url: string) => {
      const slug = extractSlugFromUrl(url);
      if (!slug) {
        throw new Error("Could not extract slug from URL");
      }
      
      const res = await fetch("/admin/api/sitemap/exclusions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: [slug] }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete URL");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast.success("URL deleted from sitemap");
      qc.invalidateQueries({ queryKey: ["sitemap-preview"] });
      qc.invalidateQueries({ queryKey: ["sitemap-exclusions"] });
    },
    onError: (error: Error) => {
      console.error("Single delete error:", error);
      toast.error(error.message || "Failed to delete URL");
    },
  });

  function toggleUrlSelection(url: string) {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  }

  function toggleSelectAll() {
    if (selectedUrls.size === filtered.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filtered.map(e => e.url)));
    }
  }

  function handleDeleteSelected() {
    if (selectedUrls.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedUrls.size} URL(s) from the sitemap?`)) return;
    deleteMutation.mutate(Array.from(selectedUrls));
  }

  function handleDeleteSingle(url: string) {
    if (!confirm(`Are you sure you want to delete this URL from the sitemap?`)) return;
    singleDeleteMutation.mutate(url);
  }

  function handleDeleteAll() {
    if (!confirm(`Are you sure you want to delete ALL ${filtered.length} visible URLs from the sitemap? This action cannot be undone.`)) return;
    // Select all visible URLs and delete them
    setSelectedUrls(new Set(filtered.map(e => e.url)));
    deleteMutation.mutate(filtered.map(e => e.url));
  }

  const filtered = (data?.entries ?? []).filter((e) => {
    const matchType = typeFilter ? e.type === typeFilter : true;
    const matchUrl = urlFilter ? e.url.toLowerCase().includes(urlFilter.toLowerCase()) : true;
    return matchType && matchUrl;
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {isDevUrl && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Development URL Detected
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Current base URL ({currentBaseUrl}) appears to be a development server. Use &quot;Auto Generate&quot; to detect the production URL from environment variables.
            </p>
          </div>
        </div>
      )}

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
        <Button
          variant={showDeleteMode ? "destructive" : "outline"}
          size="sm"
          onClick={() => setShowDeleteMode(!showDeleteMode)}
        >
          <Trash2 className="h-4 w-4" />
          {showDeleteMode ? "Cancel Delete" : "Delete URLs"}
        </Button>
        {showDeleteMode && selectedUrls.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : `Delete ${selectedUrls.size}`}
          </Button>
        )}
        {showDeleteMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAll}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting All…" : "Delete All Visible"}
          </Button>
        )}
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
              {showDeleteMode && (
                <th className="px-4 py-3 text-left font-medium w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-muted hover:text-foreground"
                    aria-label="Select all"
                  >
                    {selectedUrls.size === filtered.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
              )}
              <th className="px-4 py-3 text-left font-medium">URL</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Last Modified</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              {showDeleteMode && (
                <th className="px-4 py-3 text-left font-medium w-20">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {showDeleteMode && <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>}
                    <td className="px-4 py-3"><Skeleton className="h-4 w-72" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                    {showDeleteMode && <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>}
                  </tr>
                ))
              : filtered.map((entry, i) => (
                  <tr key={i} className={`hover:bg-surface/50 ${selectedUrls.has(entry.url) ? "bg-brand/5" : ""}`}>
                    {showDeleteMode && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleUrlSelection(entry.url)}
                          className="text-muted hover:text-foreground"
                          aria-label={`Select ${entry.url}`}
                        >
                          {selectedUrls.has(entry.url) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
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
                    {showDeleteMode && (
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSingle(entry.url)}
                          disabled={deleteMutation.isPending || singleDeleteMutation.isPending}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
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
