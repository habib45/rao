"use client";

import { useState } from "react";
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
  const [expanded, setExpanded] = useState(false);

  const selected = [
    currentProduct,
    ...candidates.filter((c) => selectedIds.includes(c.id)),
  ];

  const gridCols = `grid-cols-[180px_repeat(${selected.length},minmax(160px,1fr))]`;
  const INITIAL_DYNAMIC = 2;
  const visibleKeys = expanded
    ? comparisonKeys
    : comparisonKeys.slice(0, INITIAL_DYNAMIC);
  const hasMoreKeys = comparisonKeys.length > INITIAL_DYNAMIC;

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
              {showPrice && p.price_cents !== null && (
                <p className="mt-2 text-center text-base font-bold text-foreground">
                  {formatPrice(p.price_cents, p.currency, locale)}
                </p>
              )}
              <p className="mt-1 line-clamp-2 text-center text-sm font-semibold text-foreground leading-snug">
                {name}
              </p>
              {p.rating !== null && (
                <p
                  className="mt-1 text-center text-xs text-amber-500"
                  title={`${p.rating.toFixed(1)} out of 5`}
                >
                  {"★".repeat(Math.round(p.rating))}
                  {"☆".repeat(5 - Math.round(p.rating))}
                  <span className="ml-1 text-muted">
                    {p.rating.toFixed(1)}
                    {p.review_count ? ` (${p.review_count})` : ""}
                  </span>
                </p>
              )}
              {i === 0 && (
                <p className="mt-0.5 text-center text-xs font-semibold text-brand">
                  Viewing this item
                </p>
              )}
              {p.affiliate_url && (
                <a
                  href={p.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-2 block w-full rounded-lg bg-brand px-2 py-2 text-center text-xs font-semibold text-white hover:bg-brand-dark transition-colors"
                >
                  Buy on Amazon →
                </a>
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
        {visibleKeys.map((key, ki) => {
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

        {/* See More / See Less spanning full grid */}
        {hasMoreKeys && (
          <div
            className={`col-span-full border-t border-border/50 bg-surface/30 py-3 text-center`}
            style={{ gridColumn: `1 / span ${selected.length + 1}` }}
          >
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
            >
              {expanded ? (
                <>
                  See Less <span className="text-base">∧</span>
                </>
              ) : (
                <>
                  See More ({comparisonKeys.length - INITIAL_DYNAMIC} more
                  specs) <span className="text-base">∨</span>
                </>
              )}
            </button>
          </div>
        )}
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
