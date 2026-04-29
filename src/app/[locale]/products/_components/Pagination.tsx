"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function Pagination({
  page,
  total,
  pageSize,
}: {
  page: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-8 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-sm text-muted hover:border-brand hover:text-brand disabled:opacity-40"
        aria-label="Previous page"
      >
        ‹
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => goTo(p)}
          className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
            p === page
              ? "border-brand bg-brand text-white"
              : "border-border text-foreground hover:border-brand hover:text-brand"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-sm text-muted hover:border-brand hover:text-brand disabled:opacity-40"
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
}
