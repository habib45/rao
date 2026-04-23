"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { Category, LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border pb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-foreground hover:text-brand"
      >
        {title}
        <ChevronIcon open={open} />
      </button>
      {open && <div className="mt-1 space-y-2">{children}</div>}
    </div>
  );
}

export default function SidebarFilters({
  categories,
  brands,
  locale,
}: {
  categories: Category[];
  brands: string[];
  locale: LocaleCode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || (Array.isArray(val) && val.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(val)) {
          params.delete(key);
          val.forEach((v) => params.append(key, v));
        } else {
          params.set(key, val);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const selectedCategories = searchParams.getAll("cat");
  const selectedBrands = searchParams.getAll("brand");
  const onlySale = searchParams.get("sale") === "1";
  const onlyNew = searchParams.get("new") === "1";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  function toggleArray(
    key: string,
    current: string[],
    value: string,
  ) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    push({ [key]: next });
  }

  function applyPrice() {
    push({ minPrice: localMin || null, maxPrice: localMax || null });
  }

  function clearAll() {
    router.push(pathname);
    setLocalMin("");
    setLocalMax("");
  }

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    onlySale ||
    onlyNew ||
    minPrice ||
    maxPrice;

  return (
    <div className="rounded-xl border border-border bg-white p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-bold text-foreground">Filters</span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-brand hover:text-brand-dark"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <FilterSection title="Filter By Category">
          {categories.map((cat) => {
            const name = t(cat.name, locale) as string;
            const checked = selectedCategories.includes(cat.id);
            return (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground hover:text-brand"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    toggleArray("cat", selectedCategories, cat.id)
                  }
                  className="h-4 w-4 rounded border-border accent-brand"
                />
                {name}
              </label>
            );
          })}
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="mt-2 w-full rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          Filter
        </button>
      </FilterSection>

      {/* Brands */}
      {brands.length > 0 && (
        <FilterSection title="Brands">
          {brands.map((brand) => {
            const checked = selectedBrands.includes(brand);
            return (
              <label
                key={brand}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground hover:text-brand"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    toggleArray("brand", selectedBrands, brand)
                  }
                  className="h-4 w-4 rounded border-border accent-brand"
                />
                {brand}
              </label>
            );
          })}
        </FilterSection>
      )}

      {/* Product Flag */}
      <FilterSection title="Product Flag">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground hover:text-brand">
          <input
            type="checkbox"
            checked={onlyNew}
            onChange={() => push({ new: onlyNew ? null : "1" })}
            className="h-4 w-4 rounded border-border accent-brand"
          />
          New Arrival
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground hover:text-brand">
          <input
            type="checkbox"
            checked={onlySale}
            onChange={() => push({ sale: onlySale ? null : "1" })}
            className="h-4 w-4 rounded border-border accent-brand"
          />
          Offered Items
        </label>
      </FilterSection>
    </div>
  );
}
