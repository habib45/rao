"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  locale: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

interface ApiResponse {
  data: Subscriber[];
  total: number;
}

const PER_PAGE_OPTIONS = [20, 50, 100] as const;

export function SubscribersTable() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<(typeof PER_PAGE_OPTIONS)[number]>(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 350);
  }

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ["newsletter-subscribers", page, perPage, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      const res = await fetch(`/admin/api/newsletter/subscribers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      return res.json() as Promise<ApiResponse>;
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / perPage));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 dark:bg-surface sm:w-auto"
        />
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>{data?.total ?? 0} subscribers</span>
          <select
            value={String(perPage)}
            onChange={(e) => {
              setPerPage(Number(e.target.value) as (typeof PER_PAGE_OPTIONS)[number]);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 dark:bg-surface"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Locale</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No subscribers found.
                  </td>
                </tr>
              ) : (
                data?.data.map((sub) => (
                  <tr key={sub.id} className="bg-white hover:bg-surface/50 dark:bg-transparent">
                    <td className="px-4 py-3 font-medium">{sub.email}</td>
                    <td className="px-4 py-3 text-muted">{sub.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{sub.locale}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          sub.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {sub.is_active ? "Active" : "Unsubscribed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(sub.subscribed_at).toLocaleDateString("en", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
