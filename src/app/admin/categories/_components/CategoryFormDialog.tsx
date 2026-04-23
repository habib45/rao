"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/app/admin/_components/ui/dialog";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import { Button } from "@/app/admin/_components/ui/button";
import { slugify } from "@/app/admin/_lib/utils/slugify";

interface CategoryData {
  id?: string;
  name: Record<string, string>;
  slug: Record<string, string>;
  description: Record<string, string>;
  amazon_node_id: string | null;
  parent_id: string | null;
  sort_order: number;
  image_url: string | null;
  is_active: boolean;
}

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CategoryData) => void;
  saving: boolean;
  initial?: CategoryData | null;
  categories: { id: string; name: Record<string, string> }[];
}

const empty: CategoryData = {
  name: { en: "", "bn-BD": "", sv: "" },
  slug: { en: "", "bn-BD": "", sv: "" },
  description: { en: "", "bn-BD": "", sv: "" },
  amazon_node_id: null,
  parent_id: null,
  sort_order: 0,
  image_url: null,
  is_active: true,
};

export function CategoryFormDialog({
  open,
  onClose,
  onSave,
  saving,
  initial,
  categories,
}: CategoryFormDialogProps) {
  const [form, setForm] = useState<CategoryData>(initial ?? empty);

  useEffect(() => {
    setForm(initial ?? empty);
  }, [initial, open]);

  function setLocaleField(field: "name" | "slug" | "description", locale: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [locale]: value },
    }));
  }

  function autoSlug() {
    setForm((prev) => ({
      ...prev,
      slug: {
        en: slugify(prev.name.en || ""),
        "bn-BD": prev.slug["bn-BD"] || slugify(prev.name["bn-BD"] || ""),
        sv: prev.slug.sv || slugify(prev.name.sv || ""),
      },
    }));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial?.id ? "Edit Category" : "New Category"}
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        {(["en", "bn-BD", "sv"] as const).map((locale) => {
          const label = locale === "en" ? "English" : locale === "bn-BD" ? "Bangla" : "Swedish";
          return (
            <div key={locale} className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted">{label}</p>
              <Input
                id={`name-${locale}`}
                label="Name"
                value={form.name[locale] ?? ""}
                onChange={(e) => setLocaleField("name", locale, e.target.value)}
              />
              <Input
                id={`slug-${locale}`}
                label="Slug"
                value={form.slug[locale] ?? ""}
                onChange={(e) => setLocaleField("slug", locale, e.target.value)}
              />
              <Input
                id={`desc-${locale}`}
                label="Description"
                value={form.description[locale] ?? ""}
                onChange={(e) => setLocaleField("description", locale, e.target.value)}
              />
            </div>
          );
        })}

        <Button variant="ghost" size="sm" onClick={autoSlug}>
          Auto-generate slugs
        </Button>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="parent"
            label="Parent Category"
            value={form.parent_id ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value || null }))}
          >
            <option value="">None</option>
            {categories
              .filter((c) => c.id !== initial?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name?.en ?? c.id}
                </option>
              ))}
          </Select>

          <Input
            id="sort_order"
            label="Sort Order"
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
          />
        </div>

        <Input
          id="image_url"
          label="Image URL"
          value={form.image_url ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value || null }))}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            className="rounded border-border"
          />
          Active
        </label>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? "Saving..." : initial?.id ? "Update" : "Create"}
        </Button>
      </div>
    </Dialog>
  );
}
