"use client";

import { useState } from "react";
import type { Product, LocaleCode } from "@/types/domain";
import { ComparisonStep1 } from "./ComparisonStep1";
import { ComparisonStep2 } from "./ComparisonStep2";
import { ComparisonStep3 } from "./ComparisonStep3";
import { useComparison } from "@/lib/comparison/index";

type Step = 1 | 2 | 3;

interface Props {
  currentProduct: Product;
  candidates: Product[];
  comparisonKeys: string[];
  locale: LocaleCode;
  showPrice: boolean;
}

const STEP_LABELS = ["Select products", "Compare", "Add to cart"];

export function ComparisonWizard({
  currentProduct,
  candidates,
  comparisonKeys,
  locale,
  showPrice,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [open, setOpen] = useState(false);
  const { clear } = useComparison();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-brand/60 bg-brand/5 px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Compare with similar products
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-bold text-foreground">Compare products</h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setStep(1);
            clear();
          }}
          aria-label="Close comparison"
          className="rounded p-1 text-muted hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 border-b border-border px-6 py-3.5">
        {STEP_LABELS.map((label, idx) => {
          const n = (idx + 1) as Step;
          const isActive = n === step;
          const isDone = n < step;
          return (
            <div key={n} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-brand text-white"
                      : isDone
                        ? "bg-brand/20 text-brand"
                        : "bg-surface text-muted border border-border"
                  }`}
                >
                  {isDone ? "✓" : n}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-foreground" : "text-muted"
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <span className="mx-2 text-border text-xs">›</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="p-6">
        {step === 1 && (
          <ComparisonStep1
            currentProduct={currentProduct}
            candidates={candidates}
            locale={locale}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <ComparisonStep2
            currentProduct={currentProduct}
            candidates={candidates}
            comparisonKeys={comparisonKeys}
            locale={locale}
            showPrice={showPrice}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <ComparisonStep3
            currentProduct={currentProduct}
            candidates={candidates}
            locale={locale}
            showPrice={showPrice}
            onBack={() => setStep(2)}
            onDone={() => {
              setOpen(false);
              setStep(1);
              clear();
            }}
          />
        )}
      </div>
    </div>
  );
}
