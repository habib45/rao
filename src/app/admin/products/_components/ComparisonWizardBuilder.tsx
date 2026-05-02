"use client";

import { useState, useRef, useEffect } from "react";
import type { ComparisonColumn, ComparisonRow, ComparisonData } from "@/lib/wizard";
import { encodeComparison } from "@/lib/wizard";

interface Props {
  initialData?: ComparisonData;
  isEditing?: boolean;
  onInsert: (html: string) => void;
  onClose: () => void;
}

function makeColId() {
  return `col-${Math.random().toString(36).slice(2, 9)}`;
}

function makeRowId() {
  return `row-${Math.random().toString(36).slice(2, 9)}`;
}

function makeColumn(): ComparisonColumn {
  return { id: makeColId(), title: "", subtitle: "", imageUrl: "", price: "", link: "", badge: "" };
}

function makeRow(colIds: string[]): ComparisonRow {
  return { id: makeRowId(), label: "", values: Object.fromEntries(colIds.map((id) => [id, ""])) };
}

const COL_FIELDS: Array<{ key: keyof ComparisonColumn; label: string; placeholder: string; type?: string }> = [
  { key: "title",    label: "Name *",    placeholder: "e.g. Product A" },
  { key: "subtitle", label: "Brand",     placeholder: "e.g. Samsung" },
  { key: "imageUrl", label: "Image URL", placeholder: "https://...", type: "url" },
  { key: "price",    label: "Price",     placeholder: "e.g. $49.99" },
  { key: "link",     label: "Buy Link",  placeholder: "https://amazon.com/...", type: "url" },
  { key: "badge",    label: "Badge",     placeholder: "e.g. Best Value" },
];

export function ComparisonWizardBuilder({
  initialData,
  isEditing = false,
  onInsert,
  onClose,
}: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "Product Comparison");
  const [columns, setColumns] = useState<ComparisonColumn[]>(() =>
    initialData?.columns?.length ? initialData.columns : [makeColumn(), makeColumn()],
  );
  const [rows, setRows] = useState<ComparisonRow[]>(() =>
    initialData?.rows?.length
      ? initialData.rows
      : [makeRow(initialData?.columns?.map((c) => c.id) ?? [])],
  );

  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? Math.max(0, (window.innerWidth - 1100) / 2) : 60,
    y: 40,
  }));
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      setPos({ x: dragRef.current.ox + e.clientX - dragRef.current.sx, y: dragRef.current.oy + e.clientY - dragRef.current.sy });
    }
    function onUp() { dragRef.current = null; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  // ── Column helpers ──

  function updateColumn(id: string, patch: Partial<ComparisonColumn>) {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addColumn() {
    if (columns.length >= 6) return;
    const col = makeColumn();
    setColumns((prev) => [...prev, col]);
    setRows((prev) => prev.map((r) => ({ ...r, values: { ...r.values, [col.id]: "" } })));
  }

  function removeColumn(id: string) {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((c) => c.id !== id));
    setRows((prev) => prev.map((r) => ({
      ...r,
      values: Object.fromEntries(Object.entries(r.values).filter(([k]) => k !== id)),
    })));
  }

  function moveColumn(idx: number, dir: -1 | 1) {
    const t = idx + dir;
    if (t < 0 || t >= columns.length) return;
    const next = [...columns];
    [next[idx], next[t]] = [next[t], next[idx]];
    setColumns(next);
  }

  // ── Row helpers ──

  function updateRow(id: string, patch: { label?: string; values?: Record<string, string> }) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow(columns.map((c) => c.id))]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function moveRow(idx: number, dir: -1 | 1) {
    const t = idx + dir;
    if (t < 0 || t >= rows.length) return;
    const next = [...rows];
    [next[idx], next[t]] = [next[t], next[idx]];
    setRows(next);
  }

  // ── Insert ──

  function handleInsert() {
    const validCols = columns.filter((c) => c.title.trim());
    if (validCols.length === 0) return;
    const data: ComparisonData = {
      type: "comparison",
      title: title.trim() || "Product Comparison",
      columns: validCols,
      rows,
    };
    const encoded = encodeComparison(data);
    const label = `${validCols.length} product${validCols.length > 1 ? "s" : ""}, ${rows.length} row${rows.length !== 1 ? "s" : ""}`;
    const html = `<div class="comparison-block" data-comparison="${encoded}" style="border:2px dashed #94a3b8;padding:12px 16px;margin:16px 0;background:#f8fafc;border-radius:8px;"><strong>Comparison Wizard:</strong> ${data.title} — ${label}</div>`;
    onInsert(html);
  }

  const colCount = Math.min(columns.length, 3);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        className="fixed z-50 w-[1100px] max-w-[95vw] rounded-xl border border-border bg-white shadow-xl flex flex-col"
        style={{ left: pos.x, top: pos.y, maxHeight: "90vh" }}
      >
        {/* Draggable header */}
        <div
          className="flex cursor-grab select-none items-center justify-between rounded-t-xl border-b border-border bg-surface px-4 py-3 active:cursor-grabbing shrink-0"
          onMouseDown={(e) => {
            dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
          }}
        >
          <span className="text-sm font-semibold text-foreground">
            {isEditing ? "Edit Comparison Wizard" : "Comparison Wizard Builder"}
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:bg-border hover:text-foreground">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-4 space-y-5">
          {/* Title row */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Comparison Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Comparison"
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* ── Products ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Products{" "}
                <span className="text-xs font-normal text-muted">({columns.length}/6)</span>
              </h3>
              <button
                type="button"
                onClick={addColumn}
                disabled={columns.length >= 6}
                className="rounded-md bg-brand/10 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/20 disabled:opacity-40"
              >
                + Add Product
              </button>
            </div>

            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
            >
              {columns.map((col, i) => (
                <div key={col.id} className="rounded-lg border border-border bg-surface p-3 space-y-2">
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">Product {i + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveColumn(i, -1)} disabled={i === 0} aria-label="Move left" className="rounded p-0.5 text-xs text-muted hover:text-foreground disabled:opacity-30">←</button>
                      <button type="button" onClick={() => moveColumn(i, 1)} disabled={i === columns.length - 1} aria-label="Move right" className="rounded p-0.5 text-xs text-muted hover:text-foreground disabled:opacity-30">→</button>
                      <button type="button" onClick={() => removeColumn(col.id)} disabled={columns.length <= 1} aria-label="Remove product" className="rounded p-0.5 text-xs text-muted hover:text-red-500 disabled:opacity-30">✕</button>
                    </div>
                  </div>

                  {/* Fields */}
                  {COL_FIELDS.map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="block text-xs text-muted mb-0.5">{label}</label>
                      <input
                        type={type ?? "text"}
                        value={(col[key] as string) ?? ""}
                        onChange={(e) => updateColumn(col.id, { [key]: e.target.value } as Partial<ComparisonColumn>)}
                        placeholder={placeholder}
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── Attribute Rows ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Comparison Rows{" "}
                <span className="text-xs font-normal text-muted">({rows.length})</span>
              </h3>
              <button
                type="button"
                onClick={addRow}
                className="rounded-md bg-brand/10 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/20"
              >
                + Add Row
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="text-xs text-muted py-2">No rows yet. Click &quot;+ Add Row&quot; to add comparison attributes.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-max text-xs">
                  <thead>
                    <tr className="bg-surface">
                      <th className="border-b border-border px-2 py-2 text-center font-medium text-muted w-10">Order</th>
                      <th className="border-b border-border px-3 py-2 text-left font-medium text-muted min-w-[150px]">Attribute</th>
                      {columns.map((col, i) => (
                        <th key={col.id} className="border-b border-border px-3 py-2 text-left font-medium text-muted min-w-[130px]">
                          {col.title.trim() || `Product ${i + 1}`}
                        </th>
                      ))}
                      <th className="border-b border-border px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                        {/* Reorder */}
                        <td className="px-1 py-1.5">
                          <div className="flex flex-col items-center gap-0.5">
                            <button type="button" onClick={() => moveRow(ri, -1)} disabled={ri === 0} aria-label="Move up" className="text-muted hover:text-foreground disabled:opacity-30 text-xs">↑</button>
                            <button type="button" onClick={() => moveRow(ri, 1)} disabled={ri === rows.length - 1} aria-label="Move down" className="text-muted hover:text-foreground disabled:opacity-30 text-xs">↓</button>
                          </div>
                        </td>
                        {/* Label */}
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={row.label}
                            onChange={(e) => updateRow(row.id, { label: e.target.value })}
                            placeholder="e.g. Battery Life"
                            className="w-full rounded border border-border bg-background px-2 py-0.5 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                          />
                        </td>
                        {/* Values per column */}
                        {columns.map((col) => (
                          <td key={col.id} className="px-2 py-1.5">
                            <input
                              type="text"
                              value={row.values[col.id] ?? ""}
                              onChange={(e) =>
                                updateRow(row.id, { values: { ...row.values, [col.id]: e.target.value } })
                              }
                              placeholder="—"
                              className="w-full rounded border border-border bg-background px-2 py-0.5 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                          </td>
                        ))}
                        {/* Remove */}
                        <td className="px-2 py-1.5 text-center">
                          <button type="button" onClick={() => removeRow(row.id)} aria-label="Remove row" className="text-muted hover:text-red-500">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3 bg-surface shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-border"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!columns.some((c) => c.title.trim())}
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            {isEditing ? "Update Comparison Wizard" : "Insert Comparison Wizard"}
          </button>
        </div>
      </div>
    </>
  );
}
