"use client";

import { useState, useEffect } from "react";

interface Props {
  value: Record<string, string>;
  onChange: (val: Record<string, string>) => void;
}

interface Row {
  key: string;
  val: string;
}

function toRows(obj: Record<string, string>): Row[] {
  return Object.entries(obj).map(([key, val]) => ({ key, val }));
}

function fromRows(rows: Row[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { key, val } of rows) {
    const k = key.trim();
    if (k) result[k] = val;
  }
  return result;
}

export function AttributesEditor({ value, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>(() => toRows(value));

  useEffect(() => {
    setRows(toRows(value));
  }, [value]);

  function update(idx: number, patch: Partial<Row>) {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setRows(next);
    onChange(fromRows(next));
  }

  function addRow() {
    const next = [...rows, { key: "", val: "" }];
    setRows(next);
  }

  function removeRow(idx: number) {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
    onChange(fromRows(next));
  }

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted">
          <span>Attribute name</span>
          <span>Value</span>
          <span />
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <input
            type="text"
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="e.g. Color"
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <input
            type="text"
            value={row.val}
            onChange={(e) => update(i, { val: e.target.value })}
            placeholder="e.g. Black Green"
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="Remove attribute"
            className="rounded p-1 text-muted hover:text-red-500"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="mt-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted hover:border-brand hover:text-brand"
      >
        + Add attribute
      </button>
    </div>
  );
}
