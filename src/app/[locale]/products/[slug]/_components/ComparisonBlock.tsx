"use client";

import { useState } from "react";
import Image from "next/image";
import type { ComparisonData } from "@/lib/wizard";

type Step = 1 | 2;

interface Props {
  data: ComparisonData;
}

export function ComparisonBlock({ data }: Props) {
  const [step, setStep] = useState<Step>(1);
  const { title, columns, rows } = data;

  if (columns.length === 0) return null;

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
        <h3 className="text-sm font-bold text-foreground">{title || "Product Comparison"}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              step === 1 ? "bg-brand text-white" : "text-brand hover:bg-brand/10"
            }`}
          >
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${step === 1 ? "bg-white/20" : "bg-brand/10"}`}>
              {step > 1 ? "✓" : "1"}
            </span>
            Products
          </button>
          <span className="mx-0.5 text-border text-xs">›</span>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              step === 2 ? "bg-brand text-white" : "text-muted hover:bg-surface"
            }`}
          >
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${step === 2 ? "bg-white/20" : "bg-border"}`}>
              2
            </span>
            Compare
          </button>
        </div>
      </div>

      {/* ── Step 1: Product cards with buy button overlay ── */}
      {step === 1 && (
        <div className="p-5">
          <p className="mb-4 text-xs text-muted">
            Comparing {columns.length} product{columns.length > 1 ? "s" : ""}.
          </p>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-3">
            {columns.map((col) => (
              <div key={col.id} className="flex flex-col rounded-2xl border border-border bg-surface p-5">
                {col.badge && (
                  <span className="mb-3 self-start rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                    {col.badge}
                  </span>
                )}
                {/* Image with buy button overlay */}
                <div className="relative h-48 w-full overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-border/40">
                  {col.imageUrl ? (
                    <Image src={col.imageUrl} alt={col.title} fill sizes="260px" className="object-contain p-4" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">No image</div>
                  )}
                  {col.link && (
                    <a
                      href={col.link}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-2.5 py-0.5 text-[9px] font-semibold text-white shadow-sm hover:bg-brand-dark transition-colors"
                    >
                      Buy
                    </a>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground leading-snug line-clamp-2">{col.title}</p>
                {col.subtitle && <p className="mt-1 text-xs text-muted">{col.subtitle}</p>}
                {col.price && <p className="mt-1.5 text-base font-bold text-foreground">{col.price}</p>}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
            >
              View Comparison →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Comparison table with buy button overlay on images ── */}
      {step === 2 && (
        <div>
          {rows.length === 0 ? (
            <p className="p-5 text-sm text-muted">No comparison attributes defined.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr>
                    <th className="bg-surface p-4 min-w-35 text-left text-xs font-medium text-muted uppercase tracking-wide border-b border-border">
                      Feature
                    </th>
                    {columns.map((col) => (
                      <th key={col.id} className="bg-surface p-4 min-w-40 text-center border-b border-border">
                        {col.badge && (
                          <div className="mb-2">
                            <span className="inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                              {col.badge}
                            </span>
                          </div>
                        )}
                        {/* Image with buy button overlay */}
                        <div className="relative mx-auto mb-3 h-32 w-32 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-border/40">
                          {col.imageUrl ? (
                            <Image src={col.imageUrl} alt={col.title} fill sizes="128px" className="object-contain p-2" />
                          ) : (
                            <div className="h-full w-full rounded-xl bg-border/20" />
                          )}
                          {col.link && (
                            <a
                              href={col.link}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-2 py-0.5 text-[8px] font-semibold text-white shadow-sm hover:bg-brand-dark transition-colors"
                            >
                              Buy
                            </a>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{col.title}</p>
                        {col.subtitle && <p className="mt-0.5 text-xs text-muted">{col.subtitle}</p>}
                        {col.price && <p className="mt-1 text-base font-bold text-foreground">{col.price}</p>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={row.id} className={ri % 2 === 0 ? "bg-white" : "bg-surface/40"}>
                      <td className="px-5 py-3.5 text-sm font-semibold text-foreground border-b border-border/50">
                        {row.label || "—"}
                      </td>
                      {columns.map((col) => (
                        <td key={col.id} className="px-5 py-3.5 text-sm text-muted text-center border-b border-border/50">
                          {row.values[col.id] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
            >
              ← Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
