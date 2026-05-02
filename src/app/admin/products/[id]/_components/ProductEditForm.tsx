"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import type { ClassicEditor } from "ckeditor5";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import { Badge } from "@/app/admin/_components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/admin/_components/ui/tabs";
import { LocaleFieldGroup } from "./LocaleFieldGroup";
import { ForceSyncButton } from "./ForceSyncButton";
import { PublishScheduler } from "./PublishScheduler";
import { WorkflowActions } from "./WorkflowActions";
import { WizardBuilder } from "@/app/admin/blog/_components/WizardBuilder";
import { WizardHelp } from "@/app/admin/blog/_components/WizardHelp";
import { AttributesEditor } from "@/app/admin/products/_components/AttributesEditor";
import { ComparisonWizardBuilder } from "@/app/admin/products/_components/ComparisonWizardBuilder";
import { decodeWizard, decodeComparison } from "@/lib/wizard";
import type { WizardStep, ComparisonData } from "@/lib/wizard";
import type { Product, ProductStatus } from "@/types/domain";

const RichTextEditor = dynamic(
  () => import("@/app/admin/_components/ui/RichTextEditor"),
  { ssr: false }
);

interface Category {
  id: string;
  name: Record<string, string>;
}

const LOCALES = [
  { code: "en", label: "English" },
  { code: "bn-BD", label: "Bangla (bn-BD)" },
  { code: "sv", label: "Swedish (sv)" },
] as const;

export function ProductEditForm({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: { en: product.name?.en ?? "", "bn-BD": product.name?.["bn-BD"] ?? "", sv: product.name?.sv ?? "" },
    slug: { en: product.slug?.en ?? "", "bn-BD": product.slug?.["bn-BD"] ?? "", sv: product.slug?.sv ?? "" },
    description: { en: product.description?.en ?? "", "bn-BD": product.description?.["bn-BD"] ?? "", sv: product.description?.sv ?? "" },
    meta_title: { en: product.meta_title?.en ?? "", "bn-BD": product.meta_title?.["bn-BD"] ?? "", sv: product.meta_title?.sv ?? "" },
    meta_description: { en: product.meta_description?.en ?? "", "bn-BD": product.meta_description?.["bn-BD"] ?? "", sv: product.meta_description?.sv ?? "" },
    features: product.features ?? [],
    price_cents: product.price_cents,
    original_price_cents: product.original_price_cents,
    currency: product.currency ?? "USD",
    discount_pct: product.discount_pct ?? 0,
    category_id: product.category_id,
    brand: product.brand ?? "",
    availability: product.availability,
    is_featured: product.is_featured,
    is_active: product.is_active,
    show_in_comparison: product.show_in_comparison ?? false,
    attributes: Object.fromEntries(
      Object.entries(product.attributes ?? {}).map(([k, v]) => [k, String(v ?? "")])
    ) as Record<string, string>,
    images: (product.product_images ?? []).map((img) => ({
      url: img.url,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    })),
  });

  const [addImageUrl, setAddImageUrl] = useState("");
  const [activeLocaleTab, setActiveLocaleTab] = useState<string>("en");
  const editorRefs = useRef<Record<string, ClassicEditor | null>>({ en: null, "bn-BD": null, sv: null });
  const [showWizard, setShowWizard] = useState(false);
  const [editingWizard, setEditingWizard] = useState<{
    encoded: string;
    steps: WizardStep[];
    borderColor: string;
    borderSize: number;
  } | null>(null);
  const [showComparisonWizard, setShowComparisonWizard] = useState(false);
  const [editingComparisonWizard, setEditingComparisonWizard] = useState<{
    encoded: string;
    data: ComparisonData;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`/admin/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product saved");
    },
    onError: () => toast.error("Failed to save product"),
  });

  function updateLocaleField(locale: string, field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...(prev[field as keyof typeof prev] as Record<string, string>), [locale]: value },
    }));
  }

  function updateFeature(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  }

  function addFeature() {
    setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));
  }

  function removeFeature(index: number) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }

  function extractWizardBlocks(content: string): Array<{ encoded: string; label: string }> {
    const re = /data-wizard="([^"]+)"/g;
    const results: Array<{ encoded: string; label: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      try {
        const data = decodeWizard(m[1]);
        results.push({ encoded: m[1], label: data.steps.map((s) => s.title).filter(Boolean).join(" | ") });
      } catch { /* skip malformed */ }
    }
    return results;
  }

  function replaceWizardBlock(content: string, oldEncoded: string, newHtml: string): string {
    const marker = `data-wizard="${oldEncoded}"`;
    const markerIdx = content.indexOf(marker);
    if (markerIdx === -1) return newHtml ? content + newHtml : content;
    const divStart = content.lastIndexOf("<div", markerIdx);
    if (divStart === -1) return newHtml ? content + newHtml : content;
    const endIdx = content.indexOf("</div>", markerIdx);
    if (endIdx === -1) return newHtml ? content + newHtml : content;
    return content.slice(0, divStart) + newHtml + content.slice(endIdx + "</div>".length);
  }

  function parseWizardBorderStyle(content: string, encoded: string): { borderColor: string; borderSize: number } {
    const markerIdx = content.indexOf(`data-wizard="${encoded}"`);
    if (markerIdx === -1) return { borderColor: "#94a3b8", borderSize: 2 };
    const divStart = content.lastIndexOf("<div", markerIdx);
    if (divStart === -1) return { borderColor: "#94a3b8", borderSize: 2 };
    const tagEnd = content.indexOf(">", divStart);
    const tag = content.slice(divStart, tagEnd);
    const styleMatch = tag.match(/style="([^"]*)"/);
    if (!styleMatch) return { borderColor: "#94a3b8", borderSize: 2 };
    const borderMatch = styleMatch[1].match(/border:(\d+)px\s+dashed\s+(#[0-9a-fA-F]{3,8})/);
    return {
      borderSize: borderMatch ? parseInt(borderMatch[1]) : 2,
      borderColor: borderMatch ? borderMatch[2] : "#94a3b8",
    };
  }

  function deleteWizardBlock(encoded: string, locale?: string) {
    const loc = locale ?? activeLocaleTab;
    const desc = form.description as Record<string, string>;
    const newContent = replaceWizardBlock(desc[loc] ?? "", encoded, "");
    const editor = editorRefs.current[loc];
    if (editor) editor.setData(newContent);
    updateLocaleField(loc, "description", newContent);
  }

  function extractComparisonBlocks(content: string): Array<{ encoded: string; label: string }> {
    const re = /data-comparison="([^"]+)"/g;
    const results: Array<{ encoded: string; label: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      try {
        const data = decodeComparison(m[1]);
        results.push({ encoded: m[1], label: data.title ?? "Comparison" });
      } catch { /* skip */ }
    }
    return results;
  }

  function replaceComparisonBlock(content: string, oldEncoded: string, newHtml: string): string {
    const marker = `data-comparison="${oldEncoded}"`;
    const markerIdx = content.indexOf(marker);
    if (markerIdx === -1) return newHtml ? content + newHtml : content;
    const divStart = content.lastIndexOf("<div", markerIdx);
    if (divStart === -1) return newHtml ? content + newHtml : content;
    const endIdx = content.indexOf("</div>", markerIdx);
    if (endIdx === -1) return newHtml ? content + newHtml : content;
    return content.slice(0, divStart) + newHtml + content.slice(endIdx + "</div>".length);
  }

  function deleteComparisonBlock(encoded: string, locale?: string) {
    const loc = locale ?? activeLocaleTab;
    const desc = form.description as Record<string, string>;
    const newContent = replaceComparisonBlock(desc[loc] ?? "", encoded, "");
    const editor = editorRefs.current[loc];
    if (editor) editor.setData(newContent);
    updateLocaleField(loc, "description", newContent);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{product.name?.en ?? "Edit Product"}</h1>
          <p className="text-sm text-muted">ASIN: {product.asin}</p>
        </div>
        <div className="flex items-center gap-3">
          <ForceSyncButton productId={product.id} />
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="locales">Locales</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="brand"
              label="Brand"
              value={form.brand}
              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
            />
            <Select
              id="category"
              label="Category"
              value={form.category_id ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value || null }))}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name?.en ?? c.id}
                </option>
              ))}
            </Select>
            <Select
              id="availability"
              label="Availability"
              value={form.availability}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  availability: e.target.value as "in_stock" | "out_of_stock" | "unknown",
                }))
              }
            >
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="unknown">Unknown</option>
            </Select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="rounded border-border"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                className="rounded border-border"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.show_in_comparison}
                onChange={(e) => setForm((p) => ({ ...p, show_in_comparison: e.target.checked }))}
                className="rounded border-border"
              />
              Show in Comparison
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Attributes</p>
            <p className="text-xs text-muted">Key-value pairs used in the comparison table (e.g. Color → Black Green).</p>
            <AttributesEditor
              value={form.attributes}
              onChange={(val) => setForm((p) => ({ ...p, attributes: val }))}
            />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-medium text-muted">Amazon Data</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Last synced: {new Date(product.updated_at).toLocaleString("en")}</span>
              <Badge variant={product.is_active ? "success" : "error"}>
                {product.availability.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <WorkflowActions
            productId={product.id}
            status={(product.product_status ?? "draft") as ProductStatus}
            rejectionReason={product.rejection_reason ?? null}
          />

          {product.product_status === "approved" && (
            <PublishScheduler
              productId={product.id}
              currentPublishAt={product.publish_at ?? null}
            />
          )}
        </TabsContent>

        <TabsContent value="locales" className="mt-4 space-y-4">
          {LOCALES.map(({ code, label }) => (
            <LocaleFieldGroup
              key={code}
              locale={code}
              localeLabel={label}
              name={(form.name as Record<string, string>)[code] ?? ""}
              slug={(form.slug as Record<string, string>)[code] ?? ""}
              description={(form.description as Record<string, string>)[code] ?? ""}
              metaTitle={(form.meta_title as Record<string, string>)[code] ?? ""}
              metaDescription={(form.meta_description as Record<string, string>)[code] ?? ""}
              onChange={(field, value) => updateLocaleField(code, field, value)}
            />
          ))}
        </TabsContent>

        <TabsContent value="description" className="mt-4 space-y-4">
          <div
            role="tablist"
            className="inline-flex gap-1 rounded-lg border border-border bg-surface p-1"
          >
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                role="tab"
                aria-selected={activeLocaleTab === code}
                onClick={() => setActiveLocaleTab(code)}
                className={
                  activeLocaleTab === code
                    ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                    : "rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground"
                }
              >
                {label}
              </button>
            ))}
          </div>

          {LOCALES.map(({ code, label }) =>
            activeLocaleTab === code ? (
              <div key={code} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Description ({label})
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowWizard(true)}
                      className="rounded-lg border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors"
                    >
                      Add Wizard
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowComparisonWizard(true)}
                      className="rounded-lg border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors"
                    >
                      Add Comparison Wizard
                    </button>
                    <WizardHelp />
                  </div>
                </div>
                <RichTextEditor
                  value={(form.description as Record<string, string>)[code] ?? ""}
                  onChange={(html) => updateLocaleField(code, "description", html)}
                  onReady={(editor) => { editorRefs.current[code] = editor; }}
                  placeholder={`Description (${label})`}
                />
                {extractWizardBlocks((form.description as Record<string, string>)[code] ?? "").map(({ encoded, label: wLabel }, i) => (
                  <div
                    key={encoded}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs"
                  >
                    <span className="flex-1 truncate text-muted">
                      Wizard {i + 1}{wLabel ? `: ${wLabel}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const data = decodeWizard(encoded);
                          const content = (form.description as Record<string, string>)[code] ?? "";
                          const { borderColor, borderSize } = parseWizardBorderStyle(content, encoded);
                          setEditingWizard({ encoded, steps: data.steps, borderColor, borderSize });
                        } catch { /* ignore */ }
                      }}
                      className="font-medium text-brand hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteWizardBlock(encoded, code)}
                      className="font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {extractComparisonBlocks((form.description as Record<string, string>)[code] ?? "").map(({ encoded, label: cLabel }, i) => (
                  <div
                    key={encoded}
                    className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs"
                  >
                    <span className="text-xs font-semibold text-brand mr-1">⊞</span>
                    <span className="flex-1 truncate text-muted">
                      Comparison {i + 1}{cLabel ? `: ${cLabel}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const data = decodeComparison(encoded);
                          setEditingComparisonWizard({ encoded, data });
                        } catch { /* ignore */ }
                      }}
                      className="font-medium text-brand hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteComparisonBlock(encoded, code)}
                      className="font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : null,
          )}

          {showWizard && (
            <WizardBuilder
              onInsert={(html) => {
                const locale = activeLocaleTab;
                const editor = editorRefs.current[locale];
                const current = (form.description as Record<string, string>)[locale] ?? "";
                if (editor) {
                  editor.setData(current + html);
                  updateLocaleField(locale, "description", current + html);
                } else {
                  updateLocaleField(locale, "description", current + html);
                }
                setShowWizard(false);
              }}
              onClose={() => setShowWizard(false)}
            />
          )}

          {editingWizard && (
            <WizardBuilder
              initialSteps={editingWizard.steps}
              initialBorderColor={editingWizard.borderColor}
              initialBorderSize={editingWizard.borderSize}
              isEditing
              onInsert={(newHtml) => {
                const locale = activeLocaleTab;
                const content = (form.description as Record<string, string>)[locale] ?? "";
                const newContent = replaceWizardBlock(content, editingWizard.encoded, newHtml);
                const editor = editorRefs.current[locale];
                if (editor) editor.setData(newContent);
                updateLocaleField(locale, "description", newContent);
                setEditingWizard(null);
              }}
              onClose={() => setEditingWizard(null)}
            />
          )}

          {showComparisonWizard && (
            <ComparisonWizardBuilder
              onInsert={(html) => {
                const locale = activeLocaleTab;
                const editor = editorRefs.current[locale];
                const current = (form.description as Record<string, string>)[locale] ?? "";
                if (editor) {
                  editor.setData(current + html);
                  updateLocaleField(locale, "description", current + html);
                } else {
                  updateLocaleField(locale, "description", current + html);
                }
                setShowComparisonWizard(false);
              }}
              onClose={() => setShowComparisonWizard(false)}
            />
          )}

          {editingComparisonWizard && (
            <ComparisonWizardBuilder
              initialData={editingComparisonWizard.data}
              isEditing
              onInsert={(newHtml) => {
                const locale = activeLocaleTab;
                const content = (form.description as Record<string, string>)[locale] ?? "";
                const newContent = replaceComparisonBlock(content, editingComparisonWizard.encoded, newHtml);
                const editor = editorRefs.current[locale];
                if (editor) editor.setData(newContent);
                updateLocaleField(locale, "description", newContent);
                setEditingComparisonWizard(null);
              }}
              onClose={() => setEditingComparisonWizard(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="features" className="mt-4 space-y-3">
          {form.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={feature}
                onChange={(e) => updateFeature(i, e.target.value)}
                placeholder={`Feature ${i + 1}`}
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => removeFeature(i)}>
                Remove
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addFeature}>
            Add Feature
          </Button>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="price"
              label="Price (cents)"
              type="number"
              value={form.price_cents ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  price_cents: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
            />
            <Input
              id="original_price"
              label="Original Price (cents)"
              type="number"
              value={form.original_price_cents ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  original_price_cents: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
            />
            <Input
              id="discount_pct"
              label="Discount %"
              type="number"
              min={0}
              max={100}
              value={form.discount_pct}
              onChange={(e) =>
                setForm((p) => ({ ...p, discount_pct: parseInt(e.target.value) || 0 }))
              }
            />
          </div>
          <Select
            id="currency"
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
          >
            <option value="USD">USD</option>
            <option value="BDT">BDT</option>
            <option value="SEK">SEK</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          {form.images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {form.images
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((img, index) => (
                  <div
                    key={`${img.url}-${index}`}
                    className="relative rounded-lg border border-border p-2"
                  >
                    <Image
                      src={img.url}
                      alt="Product image"
                      width={200}
                      height={200}
                      className="aspect-square w-full rounded-lg object-cover"
                      unoptimized
                    />
                    {img.is_primary && (
                      <Badge variant="info" className="absolute right-3 top-3">
                        Primary
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          images: p.images.filter((_, idx) => idx !== index),
                        }))
                      }
                      className="absolute right-3 bottom-3 rounded bg-black/70 px-2 py-1 text-xs text-white hover:bg-black"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              No images yet. Add a URL below to attach images to this product.
            </p>
          )}

          <div className="flex gap-2">
            <Input
              id="add-image-url"
              value={addImageUrl}
              onChange={(e) => setAddImageUrl(e.target.value)}
              placeholder="https://m.media-amazon.com/images/..."
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const url = addImageUrl.trim();
                if (!url) return;
                setForm((p) => ({
                  ...p,
                  images: [
                    ...p.images,
                    {
                      url,
                      width: undefined,
                      height: undefined,
                      is_primary: p.images.length === 0,
                      sort_order: p.images.length,
                    },
                  ],
                }));
                setAddImageUrl("");
              }}
            >
              Add URL
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

