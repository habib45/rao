"use client";

import Image from "next/image";
import type { Product, LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { formatPrice } from "@/lib/i18n/format";
import { useComparison } from "@/lib/comparison/index";

interface Props {
  currentProduct: Product;
  candidates: Product[];
  comparisonKeys: string[];
  locale: LocaleCode;
  showPrice: boolean;
  onBack: () => void;
  onNext: () => void;
}

function availabilityLabel(a: Product["availability"]): string {
  if (a === "in_stock") return "✓ In Stock";
  if (a === "out_of_stock") return "✗ Out of Stock";
  return "—";
}

function starString(rating: number | null): string {
  if (rating === null) return "—";
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full) + ` ${rating.toFixed(1)}`;
}

export function ComparisonStep2({
  currentProduct,
  candidates,
  comparisonKeys,
  locale,
  showPrice,
  onBack,
  onNext,
}: Props) {
  const { selectedIds } = useComparison();

  const selected = [
    currentProduct,
    ...candidates.filter((c) => selectedIds.includes(c.id)),
  ];

  const gridCols = `grid-cols-[180px_repeat(${selected.length},minmax(160px,1fr))]`;

  function cell(product: Product, key: string): string {
    const attrs = product.attributes as Record<string, unknown> | undefined;
    if (!attrs) return "—";
    const val = attrs[key];
    if (val === undefined || val === null || val === "") return "—";
    return String(val);
  }

  const fixedRows: { label: string; render: (p: Product) => string }[] = [
    { label: "Brand", render: (p) => p.brand ?? "—" },
    ...(showPrice
      ? [
          {
            label: "Price",
            render: (p: Product) =>
              p.price_cents !== null
                ? formatPrice(p.price_cents, p.currency, locale)
                : "—",
          },
        ]
      : []),
    { label: "Rating", render: (p) => starString(p.rating) },
    { label: "Availability", render: (p) => availabilityLabel(p.availability) },
  ];

  return (
    <div className="overflow-x-auto">
      <div className={`grid ${gridCols} gap-px min-w-max`}>
        {/* Header row — product images + names */}
        <div className="bg-surface rounded-tl-lg p-4" />
        {selected.map((p, i) => {
          const name = t(p.name, locale) as string;
          const image = p.product_images?.find((img) => img.is_primary);
          return (
            <div
              key={p.id}
              className={`bg-surface p-4 ${i === selected.length - 1 ? "rounded-tr-lg" : ""}`}
            >
              <div className="relative mx-auto aspect-square w-28 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-border/40">
                {image ? (
                  <Image
                    src={image.url}
                    alt={name}
                    fill
                    sizes="112px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">
                    No img
                  </div>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-center text-sm font-semibold text-foreground leading-snug">
                {name}
              </p>
              {i === 0 && (
                <p className="mt-1 text-center text-xs font-semibold text-brand">
                  Current
                </p>
              )}
            </div>
          );
        })}

        {/* Fixed attribute rows */}
        {fixedRows.map((row, ri) => (
          <>
            <div
              key={`label-${ri}`}
              className={`px-4 py-3 text-sm font-semibold text-foreground ${ri % 2 === 0 ? "bg-surface" : "bg-white"}`}
            >
              {row.label}
            </div>
            {selected.map((p) => (
              <div
                key={`${p.id}-${ri}`}
                className={`px-4 py-3 text-sm text-muted ${ri % 2 === 0 ? "bg-surface" : "bg-white"}`}
              >
                {row.render(p)}
              </div>
            ))}
          </>
        ))}

        {/* Dynamic attribute rows from comparisonKeys */}
        {comparisonKeys.map((key, ki) => {
          const rowIdx = fixedRows.length + ki;
          return (
            <>
              <div
                key={`dyn-label-${ki}`}
                className={`px-4 py-3 text-sm font-semibold text-foreground ${rowIdx % 2 === 0 ? "bg-surface" : "bg-white"}`}
              >
                {key}
              </div>
              {selected.map((p) => (
                <div
                  key={`${p.id}-dyn-${ki}`}
                  className={`px-4 py-3 text-sm text-muted ${rowIdx % 2 === 0 ? "bg-surface" : "bg-white"}`}
                >
                  {cell(p, key)}
                </div>
              ))}
            </>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          Add to Cart →
        </button>
      </div>
    </div>
  );
}
