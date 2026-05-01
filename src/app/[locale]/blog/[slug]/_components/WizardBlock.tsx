"use client";

import { useState } from "react";
import type { WizardStep } from "@/lib/wizard";

interface Props {
  steps: WizardStep[];
}

export function WizardBlock({ steps }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (steps.length === 0) return null;

  const hasSiblings = steps.length > 1;

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {/* Tab header */}
      <div
        role="tablist"
        className="flex overflow-x-auto border-b border-border bg-surface"
      >
        {steps.map((step, i) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={i === activeIdx}
            onClick={() => setActiveIdx(i)}
            className={`shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
              i === activeIdx
                ? "border-b-2 border-brand bg-white text-brand"
                : "text-muted hover:text-foreground"
            }`}
          >
            {i < activeIdx ? `✓ ${step.title}` : step.title}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div
        role="tabpanel"
        className="p-5 transition-opacity duration-200"
      >
        <div
          className="article-content max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: steps[activeIdx].content }}
        />
      </div>

      {/* Navigation footer */}
      {hasSiblings && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={() => setActiveIdx((i) => i - 1)}
            disabled={activeIdx === 0}
            aria-label="Previous step"
            className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-xs text-muted">
            {activeIdx + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={() => setActiveIdx((i) => i + 1)}
            disabled={activeIdx === steps.length - 1}
            aria-label="Next step"
            className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
