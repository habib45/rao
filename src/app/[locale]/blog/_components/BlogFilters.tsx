"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { PER_PAGE_OPTIONS, type BlogView } from "./blog-constants";

export { PER_PAGE_OPTIONS };

interface Props {
  currentPerPage: number;
  currentSearch: string;
  totalCount: number;
  currentView: BlogView;
}

export function BlogFilters({
  currentPerPage,
  currentSearch,
  totalCount,
  currentView,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      }
      params.delete("page");
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search === currentSearch) return;
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: search || null }));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, currentSearch, buildUrl, router]);

  function handlePerPage(value: string) {
    router.push(buildUrl({ perPage: value === String(PER_PAGE_OPTIONS[0]) ? null : value }));
  }

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles…"
          className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>

      {/* Per-page + count + view toggle */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted hidden sm:inline">
          {totalCount} article{totalCount !== 1 ? "s" : ""}
        </span>
        <label className="flex items-center gap-2 text-muted">
          Show
          <select
            value={String(currentPerPage)}
            onChange={(e) => handlePerPage(e.target.value)}
            className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
          per page
        </label>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border bg-white p-0.5">
          <button
            type="button"
            aria-label="List view"
            onClick={() => router.push(buildUrl({ view: null }))}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              currentView === "list"
                ? "bg-brand text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
              <rect x="1" y="2" width="14" height="2.5" rx="1" />
              <rect x="1" y="6.75" width="14" height="2.5" rx="1" />
              <rect x="1" y="11.5" width="14" height="2.5" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => router.push(buildUrl({ view: "grid" }))}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              currentView === "grid"
                ? "bg-brand text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
