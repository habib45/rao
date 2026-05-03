"use client";

import { useState } from "react";
import Image from "next/image";
import type { ComparisonData } from "@/lib/wizard";

interface Props {
  data: ComparisonData;
}

export function ComparisonBlock({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { title, columns, rows } = data;
  const INITIAL_ROWS = 4;
  const visibleRows = expanded ? rows : rows.slice(0, INITIAL_ROWS);
  const hasMoreRows = rows.length > INITIAL_ROWS;

  if (columns.length === 0) return null;

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-border bg-surface px-5 py-3">
        <h3 className="text-sm font-bold text-foreground">
          {title || "Product Comparison"}
        </h3>
      </div>

      {/* Comparison table */}
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-muted">
          No comparison attributes defined.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr>
                <th className="bg-surface p-4 min-w-35 text-left text-xs font-medium text-muted uppercase tracking-wide border-b border-border">
                  Feature
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="bg-surface p-4 min-w-40 text-center border-b border-border"
                  >
                    {col.badge && (
                      <div className="mb-2">
                        <span className="inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                          {col.badge}
                        </span>
                      </div>
                    )}
                    <div className="relative mx-auto mb-3 h-32 w-32 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-border/40">
                      {col.imageUrl ? (
                        <Image
                          src={col.imageUrl}
                          alt={col.title}
                          fill
                          sizes="128px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="h-full w-full rounded-xl bg-border/20" />
                      )}
                    </div>
                    <p className="text-left text-[10px]">
                      <span className="font-medium text-muted">Name: </span>
                      <span className="font-semibold text-foreground">
                        {col.title.length > 25
                          ? col.title.slice(0, 25) + "…"
                          : col.title}
                      </span>
                    </p>
                    {col.price && (
                      <p className="mt-0.5 text-left text-[10px]">
                        <span className="font-medium text-muted">Price: </span>
                        <span className="font-bold text-foreground">
                          {col.price}
                        </span>
                      </p>
                    )}
                    {col.rating != null && (
                      <p className="mt-0.5 text-left text-[10px]">
                        <span className="font-medium text-muted">Rating: </span>
                        <span className="text-amber-500">
                          {"★".repeat(Math.round(col.rating))}
                          {"☆".repeat(5 - Math.round(col.rating))}
                        </span>
                        <span className="ml-1 font-semibold text-foreground">
                          {col.rating.toFixed(1)}
                        </span>
                      </p>
                    )}
                    {col.link && (
                      <a
                        href={col.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-2 block w-full rounded-md bg-brand px-2 py-0.75 text-center text-[10px] font-semibold text-white hover:bg-brand-dark transition-colors"
                      >
                        Buy on Amazon →
                      </a>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, ri) => (
                <tr
                  key={row.id}
                  className={ri % 2 === 0 ? "bg-white" : "bg-surface/40"}
                >
                  <td className="px-5 py-3.5 text-sm font-semibold text-foreground border-b border-border/50">
                    {row.label || "—"}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className="px-5 py-3.5 text-sm text-muted text-center border-b border-border/50"
                    >
                      {row.values[col.id] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {hasMoreRows && (
            <div className="border-t border-border/50 bg-surface/30 py-3 text-center">
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
                    See More ({rows.length - INITIAL_ROWS} more specs){" "}
                    <span className="text-base">∨</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
