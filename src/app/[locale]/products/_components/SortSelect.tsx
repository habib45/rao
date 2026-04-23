"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ProductSortOrder } from "@/lib/queries/products";

const options: { value: ProductSortOrder | "newest"; label: string }[] = [
  { value: "newest", label: "Default Sorting" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("sort") as ProductSortOrder) ?? "newest";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium text-muted">Sort By</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-md border border-border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
