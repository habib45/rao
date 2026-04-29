"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, X, GripVertical } from "lucide-react";

interface Category {
  id: string;
  name: { en: string; "bn-BD"?: string; sv?: string };
  slug: { en: string; "bn-BD"?: string; sv?: string };
  description?: { en?: string; "bn-BD"?: string; sv?: string };
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

interface CategoryFormState {
  name_en: string;
  name_bn: string;
  name_sv: string;
  slug_en: string;
  slug_bn: string;
  slug_sv: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const defaultForm = (): CategoryFormState => ({
  name_en: "",
  name_bn: "",
  name_sv: "",
  slug_en: "",
  slug_bn: "",
  slug_sv: "",
  color: "#f59e0b",
  sort_order: 0,
  is_active: true,
});

function toPayload(f: CategoryFormState) {
  return {
    name: { en: f.name_en, "bn-BD": f.name_bn || undefined, sv: f.name_sv || undefined },
    slug: { en: f.slug_en, "bn-BD": f.slug_bn || undefined, sv: f.slug_sv || undefined },
    color: f.color || null,
    sort_order: f.sort_order,
    is_active: f.is_active,
  };
}

function slugify(val: string) {
  return val
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/admin/api/blog/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  const json = await res.json() as { categories: Category[] };
  return json.categories;
}

export function BlogCategoriesClient() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: fetchCategories,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(defaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof toPayload>) => {
      const res = await fetch("/admin/api/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Failed to create category");
      }
    },
    onSuccess: () => {
      toast.success("Category created");
      qc.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      setShowForm(false);
      setForm(defaultForm());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ReturnType<typeof toPayload> }) => {
      const res = await fetch(`/admin/api/blog/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Failed to update category");
      }
    },
    onSuccess: () => {
      toast.success("Category updated");
      qc.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      setEditingId(null);
      setForm(defaultForm());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/admin/api/blog/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Failed to delete category");
      }
    },
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      setDeletingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setShowForm(false);
    setForm({
      name_en: cat.name.en ?? "",
      name_bn: cat.name["bn-BD"] ?? "",
      name_sv: cat.name.sv ?? "",
      slug_en: cat.slug.en ?? "",
      slug_bn: cat.slug["bn-BD"] ?? "",
      slug_sv: cat.slug.sv ?? "",
      color: cat.color ?? "#f59e0b",
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = toPayload(form);
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Create / Edit form */}
      {(showForm || editingId) && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">
            {editingId ? "Edit Category" : "New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Names */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">Name</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">English *</label>
                  <input
                    type="text"
                    required
                    value={form.name_en}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((p) => ({
                        ...p,
                        name_en: v,
                        slug_en: editingId ? p.slug_en : slugify(v),
                      }));
                    }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Bengali</label>
                  <input
                    type="text"
                    value={form.name_bn}
                    onChange={(e) => setForm((p) => ({ ...p, name_bn: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Swedish</label>
                  <input
                    type="text"
                    value={form.name_sv}
                    onChange={(e) => setForm((p) => ({ ...p, name_sv: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>
            </fieldset>

            {/* Slugs */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">Slug</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">English *</label>
                  <input
                    type="text"
                    required
                    value={form.slug_en}
                    onChange={(e) => setForm((p) => ({ ...p, slug_en: slugify(e.target.value) }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Bengali</label>
                  <input
                    type="text"
                    value={form.slug_bn}
                    onChange={(e) => setForm((p) => ({ ...p, slug_bn: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Swedish</label>
                  <input
                    type="text"
                    value={form.slug_sv}
                    onChange={(e) => setForm((p) => ({ ...p, slug_sv: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>
            </fieldset>

            {/* Color, sort_order, is_active */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1 block text-xs text-muted">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    className="h-9 w-14 cursor-pointer rounded border border-border"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    className="w-28 rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                  className="w-24 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 accent-brand"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {isSaving ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelEdit();
                  setShowForm(false);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border/50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table card */}
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm text-muted">{categories.length} categories</p>
          {!showForm && !editingId && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" />
              New Category
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">
            No categories yet. Create one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug (EN)</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 text-muted">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {cat.color && (
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        {cat.name.en}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">{cat.slug.en}</td>
                    <td className="px-4 py-3">
                      {cat.color ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted">
                          <span
                            className="h-4 w-4 rounded border border-border"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.color}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{cat.sort_order}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          cat.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(cat)}
                          className="rounded p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {deletingId === cat.id ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            Sure?
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(cat.id)}
                              disabled={deleteMutation.isPending}
                              className="rounded p-1 hover:bg-red-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="rounded p-1 hover:bg-surface"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(cat.id)}
                            className="rounded p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
