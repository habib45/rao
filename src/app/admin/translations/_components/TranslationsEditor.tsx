"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select } from "@/app/admin/_components/ui/select";
import { Button } from "@/app/admin/_components/ui/button";
import { Badge } from "@/app/admin/_components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/admin/_components/ui/table";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

interface TranslationRow {
  id: string;
  asin?: string;
  _missing: { field: string; locale: string }[];
  [key: string]: unknown;
}

interface TranslationsResponse {
  table: string;
  fields: string[];
  locales: string[];
  rows: TranslationRow[];
}

interface PendingEdit {
  table: string;
  id: string;
  field: string;
  locale: string;
  value: string;
}

export function TranslationsEditor() {
  const queryClient = useQueryClient();
  const [table, setTable] = useState("products");
  const [edits, setEdits] = useState<PendingEdit[]>([]);

  const { data, isLoading } = useQuery<TranslationsResponse>({
    queryKey: ["admin-translations", table],
    queryFn: async () => {
      const res = await fetch(`/admin/api/translations?table=${table}`);
      if (!res.ok) throw new Error("Failed to fetch translations");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: PendingEdit[]) => {
      const res = await fetch("/admin/api/translations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok && res.status !== 207) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: (result) => {
      if (result.errors?.length) {
        toast.error(`Saved with ${result.errors.length} error(s)`);
      } else {
        toast.success(`Saved ${edits.length} translation(s)`);
      }
      setEdits([]);
      queryClient.invalidateQueries({ queryKey: ["admin-translations"] });
    },
    onError: () => toast.error("Failed to save translations"),
  });

  function getFieldValue(row: TranslationRow, field: string, locale: string): string {
    const map = row[field] as Record<string, string> | undefined;
    return map?.[locale] ?? "";
  }

  function getPendingValue(id: string, field: string, locale: string): string | undefined {
    return edits.find(
      (e) => e.id === id && e.field === field && e.locale === locale
    )?.value;
  }

  function handleEdit(id: string, field: string, locale: string, value: string) {
    setEdits((prev) => {
      const filtered = prev.filter(
        (e) => !(e.id === id && e.field === field && e.locale === locale)
      );
      return [...filtered, { table, id, field, locale, value }];
    });
  }

  const fields = data?.fields ?? [];
  const locales = data?.locales ?? [];
  const rows = data?.rows ?? [];
  const missingCount = rows.reduce((sum, r) => sum + r._missing.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          id="trans-table"
          label="Table"
          value={table}
          onChange={(e) => { setTable(e.target.value); setEdits([]); }}
        >
          <option value="products">Products</option>
          <option value="categories">Categories</option>
        </Select>

        {missingCount > 0 && (
          <Badge variant="warning">{missingCount} missing translations</Badge>
        )}

        <div className="ml-auto flex gap-2">
          {edits.length > 0 && (
            <Button variant="secondary" onClick={() => setEdits([])}>
              Discard ({edits.length})
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate(edits)}
            disabled={edits.length === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : `Save (${edits.length})`}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background">Item</TableHead>
                {fields.map((field) =>
                  locales.map((locale) => (
                    <TableHead key={`${field}-${locale}`}>
                      {field}
                      <span className="ml-1 text-xs text-muted">({locale})</span>
                    </TableHead>
                  ))
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const label =
                  (row.asin as string) ??
                  ((row.name as Record<string, string>)?.en || row.id);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="sticky left-0 bg-background font-medium">
                      <span className="block max-w-[150px] truncate">{label}</span>
                    </TableCell>
                    {fields.map((field) =>
                      locales.map((locale) => {
                        const current = getFieldValue(row, field, locale);
                        const pending = getPendingValue(row.id, field, locale);
                        const value = pending ?? current;
                        const isMissing = row._missing.some(
                          (m) => m.field === field && m.locale === locale
                        );
                        const isEdited = pending !== undefined;

                        return (
                          <TableCell key={`${field}-${locale}`} className="min-w-[180px]">
                            <input
                              type="text"
                              value={value}
                              onChange={(e) =>
                                handleEdit(row.id, field, locale, e.target.value)
                              }
                              className={`w-full rounded border px-2 py-1 text-sm ${
                                isEdited
                                  ? "border-brand bg-brand/5"
                                  : isMissing
                                    ? "border-warning bg-warning/5"
                                    : "border-border bg-transparent"
                              }`}
                            />
                          </TableCell>
                        );
                      })
                    )}
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={1 + fields.length * locales.length}
                    className="py-8 text-center text-muted"
                  >
                    No items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
