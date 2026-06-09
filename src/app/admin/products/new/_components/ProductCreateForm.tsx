"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { ClassicEditor } from "ckeditor5";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/admin/_components/ui/tabs";
import type { ProductPreviewData } from "@/lib/amazon/types";
import { WizardBuilder } from "@/app/admin/blog/_components/WizardBuilder";
import { WizardHelp } from "@/app/admin/blog/_components/WizardHelp";
import { AttributesEditor } from "@/app/admin/products/_components/AttributesEditor";
import { ComparisonWizardBuilder } from "@/app/admin/products/_components/ComparisonWizardBuilder";
import { decodeWizard, decodeComparison } from "@/lib/wizard";
import type { WizardStep, ComparisonData } from "@/lib/wizard";
import { AIAssistantModal } from "@/app/admin/_components/AIAssistantModal";

const ProductDescriptionEditor = dynamic(
  () => import("@/app/admin/_components/ui/RichTextEditor"),
  { ssr: false },
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

type LocaleCode = (typeof LOCALES)[number]["code"];

interface ImageEntry {
  url: string;
  width?: number;
  height?: number;
  variant?: string;
}

interface CreateForm {
  asin: string;
  name: Record<LocaleCode, string>;
  slug: Record<LocaleCode, string>;
  description: Record<LocaleCode, string>;
  meta_title: Record<LocaleCode, string>;
  meta_description: Record<LocaleCode, string>;
  features: string[];
  price: string;
  original_price: string;
  currency: string;
  discount_pct: number;
  category_id: string;
  brand: string;
  affiliate_url: string;
  availability: "in_stock" | "out_of_stock" | "unknown";
  is_featured: boolean;
  show_in_comparison: boolean;
  images: ImageEntry[];
  attributes: Record<string, string>;
}

const emptyLocaleMap = (): Record<LocaleCode, string> => ({
  en: "",
  "bn-BD": "",
  sv: "",
});

const initialForm: CreateForm = {
  asin: "",
  name: emptyLocaleMap(),
  slug: emptyLocaleMap(),
  description: emptyLocaleMap(),
  meta_title: emptyLocaleMap(),
  meta_description: emptyLocaleMap(),
  features: [],
  price: "",
  original_price: "",
  currency: "USD",
  discount_pct: 0,
  category_id: "",
  brand: "",
  affiliate_url: "",
  availability: "unknown",
  is_featured: false,
  show_in_comparison: false,
  images: [],
  attributes: {},
};

interface ProductCreateFormProps {
  categories: Category[];
}

export function ProductCreateForm({ categories }: ProductCreateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreateForm>(initialForm);
  const [submitting, setSubmitting] = useState<"draft" | "review" | null>(null);
  const [syncAsin, setSyncAsin] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [syncError, setSyncError] = useState("");
  const [activeLocaleTab, setActiveLocaleTab] = useState<LocaleCode>("en");
  const [pasteJson, setPasteJson] = useState("");
  const [showPastePanel, setShowPastePanel] = useState(false);
  const [addImageUrl, setAddImageUrl] = useState("");
  const editorRefs = useRef<Record<LocaleCode, ClassicEditor | null>>({
    en: null,
    "bn-BD": null,
    sv: null,
  });
  const [showWizard, setShowWizard] = useState(false);
  const [editingWizard, setEditingWizard] = useState<{
    encoded: string;
    steps: WizardStep[];
    borderColor: string;
    borderSize: number;
    showFooter: boolean;
    shadow: string;
    showBorder: boolean;
    showPanelBorder: boolean;
    panelBorderColor: string;
  } | null>(null);
  const [showComparisonWizard, setShowComparisonWizard] = useState(false);
  const [editingComparisonWizard, setEditingComparisonWizard] = useState<{
    encoded: string;
    data: ComparisonData;
  } | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  function setLocaleField(
    field: "name" | "slug" | "description" | "meta_title" | "meta_description",
    locale: LocaleCode,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [locale]: value },
    }));
  }

  function addFeature() {
    setForm((prev) => ({ ...prev, features: [...prev.features, ""] }));
  }

  function updateFeature(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  }

  function removeFeature(index: number) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }

  function applyPreview(preview: ProductPreviewData) {
    const price =
      preview.price_cents != null
        ? (preview.price_cents / 100).toFixed(2)
        : "";
    const originalPrice =
      preview.original_price_cents != null
        ? (preview.original_price_cents / 100).toFixed(2)
        : "";

    setForm((prev) => ({
      ...prev,
      asin: preview.asin || prev.asin,
      name: { ...prev.name, en: preview.name.en || prev.name.en },
      slug: { ...prev.slug, en: preview.slug.en || prev.slug.en },
      description: {
        ...prev.description,
        en: preview.description.en || prev.description.en,
      },
      features: preview.features.length > 0 ? preview.features : prev.features,
      price: price || prev.price,
      original_price: originalPrice || prev.original_price,
      currency: preview.currency || prev.currency,
      brand: preview.brand || prev.brand,
      affiliate_url: preview.affiliate_url || prev.affiliate_url,
      availability: preview.availability || prev.availability,
      images: preview.images.length > 0 ? preview.images : prev.images,
      attributes: Object.keys(preview.attributes).length > 0
        ? Object.fromEntries(
            Object.entries(preview.attributes).map(([k, v]) => [k, String(v ?? "")])
          )
        : prev.attributes,
    }));
  }

  async function handleSync() {
    if (!syncAsin.trim()) return;
    setSyncing(true);
    setSyncStatus("idle");
    setSyncError("");
    try {
      const res = await fetch("/admin/api/products/fetch-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asin: syncAsin.trim().toUpperCase() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Fetch failed");
      }
      applyPreview(data as ProductPreviewData);
      setSyncStatus("success");
      toast.success("Autofilled from Amazon");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fetch failed";
      setSyncStatus("error");
      setSyncError(message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }

  async function handlePasteJson() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(pasteJson);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    setSyncing(true);
    setSyncStatus("idle");
    setSyncError("");
    try {
      const res = await fetch("/admin/api/products/fetch-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalog_item: parsed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Parse failed");
      }
      applyPreview(data as ProductPreviewData);
      setSyncStatus("success");
      setPasteJson("");
      setShowPastePanel(false);
      toast.success("Autofilled from getCatalogItem JSON");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Parse failed";
      setSyncStatus("error");
      setSyncError(message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }

  function extractWizardBlocks(content: string): Array<{ encoded: string; label: string }> {
    const re = /data-wizard="([^"]+)"/g;
    const results: Array<{ encoded: string; label: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      try {
        const data = decodeWizard(m[1]);
        results.push({
          encoded: m[1],
          label: data.steps.map((s) => s.title).filter(Boolean).join(" | "),
        });
      } catch {
        // skip malformed blocks
      }
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

  function deleteWizardBlock(encoded: string, locale?: LocaleCode) {
    const loc = locale ?? activeLocaleTab;
    const newContent = replaceWizardBlock(form.description[loc], encoded, "");
    const editor = editorRefs.current[loc];
    if (editor) editor.setData(newContent);
    setLocaleField("description", loc, newContent);
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

  function deleteComparisonBlock(encoded: string, locale?: LocaleCode) {
    const loc = locale ?? activeLocaleTab;
    const newContent = replaceComparisonBlock(form.description[loc], encoded, "");
    const editor = editorRefs.current[loc];
    if (editor) editor.setData(newContent);
    setLocaleField("description", loc, newContent);
  }

  async function submit(status: "draft" | "pending_review") {
    if (!form.name.en.trim()) {
      toast.error("English name is required");
      return;
    }
    if (!form.slug.en.trim()) {
      toast.error("English slug is required");
      return;
    }

    setSubmitting(status === "draft" ? "draft" : "review");

    const validImages = form.images.filter((img) => img.url.trim().length > 0);

    const payload = {
      asin: form.asin || undefined,
      name: form.name,
      slug: form.slug,
      description: form.description,
      meta_title: form.meta_title,
      meta_description: form.meta_description,
      features: form.features.filter((f) => f.trim().length > 0),
      price_cents: form.price ? Math.round(Number(form.price) * 100) : null,
      original_price_cents: form.original_price
        ? Math.round(Number(form.original_price) * 100)
        : null,
      currency: form.currency,
      discount_pct: form.discount_pct,
      category_id: form.category_id || null,
      brand: form.brand || null,
      affiliate_url: form.affiliate_url || "",
      availability: form.availability,
      is_featured: form.is_featured,
      show_in_comparison: form.show_in_comparison,
      product_status: status,
      attributes: form.attributes,
      images: validImages.map((img, i) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        is_primary: i === 0,
        sort_order: i,
      })),
    };

    try {
      const res = await fetch("/admin/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to save");
      }
      toast.success(status === "draft" ? "Draft saved" : "Submitted for review");
      const id = data?.id;
      router.push(typeof id === "string" ? `/admin/products/${id}` : "/admin/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(null);
    }
  }

  const specEntries = Object.entries(form.attributes).filter(([, v]) => v != null && v !== "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Product</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => submit("draft")}
            disabled={submitting !== null}
          >
            {submitting === "draft" ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => submit("pending_review")}
            disabled={submitting !== null}
          >
            {submitting === "review" ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </div>

      {/* Amazon Sync */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Sync from Amazon</h3>
          <button
            type="button"
            onClick={() => setShowPastePanel((v) => !v)}
            className="text-xs text-brand hover:text-brand-dark"
          >
            {showPastePanel ? "Hide" : "Paste getCatalogItem JSON"}
          </button>
        </div>

        {/* Fetch by ASIN */}
        <div className="flex flex-wrap gap-2">
          <Input
            id="sync-asin"
            value={syncAsin}
            onChange={(e) => setSyncAsin(e.target.value.toUpperCase())}
            placeholder="B0XXXXXXXXXX"
            className="min-w-50 flex-1"
          />
          <Button onClick={handleSync} disabled={syncing || !syncAsin.trim()}>
            {syncing ? "Fetching..." : "Fetch from Amazon"}
          </Button>
        </div>

        {/* Paste getCatalogItem JSON */}
        {showPastePanel && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted">
              Paste getCatalogItem API response JSON
            </label>
            <textarea
              value={pasteJson}
              onChange={(e) => setPasteJson(e.target.value)}
              rows={6}
              placeholder='{ "asin": "B07N4M94X4", "attributes": { ... }, "summaries": [...], ... }'
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand resize-y"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePasteJson}
              disabled={syncing || !pasteJson.trim()}
            >
              {syncing ? "Parsing..." : "Apply JSON"}
            </Button>
          </div>
        )}

        {syncStatus === "success" && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Fields autofilled from Amazon
          </p>
        )}
        {syncStatus === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{syncError}</p>
        )}
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="locales">Locales</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="images">
            Images{form.images.length > 0 ? ` (${form.images.length})` : ""}
          </TabsTrigger>
          {specEntries.length > 0 && (
            <TabsTrigger value="specs">Specs</TabsTrigger>
          )}
        </TabsList>

        {/* ── General ─────────────────────────────────────────── */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="asin"
              label="ASIN"
              value={form.asin}
              onChange={(e) =>
                setForm((p) => ({ ...p, asin: e.target.value.toUpperCase() }))
              }
              placeholder="B0XXXXXXXXXX"
            />
            <Input
              id="brand"
              label="Brand"
              value={form.brand}
              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
            />
            <Select
              id="category"
              label="Category"
              value={form.category_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, category_id: e.target.value }))
              }
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
                  availability: e.target.value as
                    | "in_stock"
                    | "out_of_stock"
                    | "unknown",
                }))
              }
            >
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="unknown">Unknown</option>
            </Select>
            <Input
              id="affiliate-url"
              label="Affiliate URL"
              value={form.affiliate_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, affiliate_url: e.target.value }))
              }
              placeholder="https://www.amazon.com/dp/..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_featured: e.target.checked }))
              }
              className="rounded border-border"
            />
            Featured product
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.show_in_comparison}
              onChange={(e) =>
                setForm((p) => ({ ...p, show_in_comparison: e.target.checked }))
              }
              className="rounded border-border"
            />
            Show in Comparison
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">Attributes</p>
            <p className="text-xs text-muted">Key-value pairs used in the comparison table (e.g. Color → Black Green).</p>
            <AttributesEditor
              value={form.attributes}
              onChange={(val) => setForm((p) => ({ ...p, attributes: val }))}
            />
          </div>
        </TabsContent>

        {/* ── Locales ──────────────────────────────────────────── */}
        <TabsContent value="locales" className="mt-4 space-y-4">
          {LOCALES.map(({ code, label }) => (
            <div key={code} className="space-y-4 rounded-lg border border-border p-4">
              <h4 className="text-sm font-medium">{label}</h4>

              <Input
                id={`name-${code}`}
                label="Name"
                value={form.name[code]}
                onChange={(e) => setLocaleField("name", code, e.target.value)}
              />

              <Input
                id={`slug-${code}`}
                label="Slug"
                value={form.slug[code]}
                onChange={(e) => setLocaleField("slug", code, e.target.value)}
              />

              <div className="space-y-1">
                <label htmlFor={`desc-${code}`} className="block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id={`desc-${code}`}
                  value={form.description[code]}
                  onChange={(e) => setLocaleField("description", code, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <Input
                id={`meta-title-${code}`}
                label="Meta Title"
                value={form.meta_title[code]}
                onChange={(e) => setLocaleField("meta_title", code, e.target.value)}
              />

              <Input
                id={`meta-desc-${code}`}
                label="Meta Description"
                value={form.meta_description[code]}
                onChange={(e) => setLocaleField("meta_description", code, e.target.value)}
              />
            </div>
          ))}
        </TabsContent>

        {/* ── Description ──────────────────────────────────────── */}
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
                      onClick={() => setShowAIAssistant(true)}
                      className="rounded-lg border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors"
                    >
                      AI Assistant
                    </button>
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
                <ProductDescriptionEditor
                  value={form.description[code]}
                  onChange={(html: string) => setLocaleField("description", code, html)}
                  onReady={(editor: any) => { editorRefs.current[code] = editor; }}
                  placeholder={`Description (${label})`}
                />
                {extractWizardBlocks(form.description[code]).map(({ encoded, label: wLabel }, i) => (
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
                          const { borderColor, borderSize } = parseWizardBorderStyle(form.description[code], encoded);
                          setEditingWizard({ encoded, steps: data.steps, borderColor, borderSize, showFooter: data.showFooter ?? true, shadow: data.shadow ?? "shadow-sm", showBorder: data.showBorder ?? true, showPanelBorder: data.showPanelBorder ?? true, panelBorderColor: data.panelBorderColor ?? "#e2e8f0" });
                        } catch {
                          // ignore
                        }
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
                {extractComparisonBlocks(form.description[code]).map(({ encoded, label: cLabel }, i) => (
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

          {/* New wizard modal */}
          {showWizard && (
            <WizardBuilder
              onInsert={(html) => {
                const locale = activeLocaleTab;
                const editor = editorRefs.current[locale];
                if (editor) {
                  const current = editor.getData();
                  editor.setData(current + html);
                  setLocaleField("description", locale, current + html);
                } else {
                  setLocaleField("description", locale, form.description[locale] + html);
                }
                setShowWizard(false);
              }}
              onClose={() => setShowWizard(false)}
            />
          )}

          {/* Edit existing wizard modal */}
          {editingWizard && (
            <WizardBuilder
              initialSteps={editingWizard.steps}
              initialBorderColor={editingWizard.borderColor}
              initialBorderSize={editingWizard.borderSize}
              initialShowFooter={editingWizard.showFooter}
              initialShadow={editingWizard.shadow}
              initialShowBorder={editingWizard.showBorder}
              initialShowPanelBorder={editingWizard.showPanelBorder}
              initialPanelBorderColor={editingWizard.panelBorderColor}
              isEditing
              onInsert={(newHtml) => {
                const locale = activeLocaleTab;
                const newContent = replaceWizardBlock(form.description[locale], editingWizard.encoded, newHtml);
                const editor = editorRefs.current[locale];
                if (editor) editor.setData(newContent);
                setLocaleField("description", locale, newContent);
                setEditingWizard(null);
              }}
              onClose={() => setEditingWizard(null)}
            />
          )}

          {/* New comparison wizard modal */}
          {showComparisonWizard && (
            <ComparisonWizardBuilder
              onInsert={(html) => {
                const locale = activeLocaleTab;
                const editor = editorRefs.current[locale];
                if (editor) {
                  const current = editor.getData();
                  editor.setData(current + html);
                  setLocaleField("description", locale, current + html);
                } else {
                  setLocaleField("description", locale, form.description[locale] + html);
                }
                setShowComparisonWizard(false);
              }}
              onClose={() => setShowComparisonWizard(false)}
            />
          )}

          {/* Edit existing comparison wizard modal */}
          {editingComparisonWizard && (
            <ComparisonWizardBuilder
              initialData={editingComparisonWizard.data}
              isEditing
              onInsert={(newHtml) => {
                const locale = activeLocaleTab;
                const newContent = replaceComparisonBlock(form.description[locale], editingComparisonWizard.encoded, newHtml);
                const editor = editorRefs.current[locale];
                if (editor) editor.setData(newContent);
                setLocaleField("description", locale, newContent);
                setEditingComparisonWizard(null);
              }}
              onClose={() => setEditingComparisonWizard(null)}
            />
          )}

          {/* AI Assistant Modal */}
          {showAIAssistant && (
            <AIAssistantModal
              isOpen={showAIAssistant}
              onClose={() => setShowAIAssistant(false)}
              onGenerate={(description) => {
                const locale = activeLocaleTab;
                const editor = editorRefs.current[locale];
                if (editor) {
                  const current = editor.getData();
                  editor.setData(current + description);
                  setLocaleField("description", locale, current + description);
                } else {
                  setLocaleField("description", locale, form.description[locale] + description);
                }
              }}
              productName={form.name[activeLocaleTab]}
              currentDescription={form.description[activeLocaleTab]}
              locale={activeLocaleTab}
            />
          )}
        </TabsContent>

        {/* ── Features / Bullet Points ─────────────────────────── */}
        <TabsContent value="features" className="mt-4 space-y-3">
          <p className="text-sm text-muted">
            Bullet-point highlights shown on the product page. Imported from
            Amazon&apos;s <code>bullet_point</code> attribute.
          </p>
          {form.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 text-xs font-mono text-muted w-5 shrink-0">
                {i + 1}.
              </span>
              <textarea
                value={feature}
                onChange={(e) => updateFeature(i, e.target.value)}
                rows={2}
                placeholder={`Feature ${i + 1}`}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand resize-y"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFeature(i)}
                className="mt-1"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addFeature}>
            Add Feature
          </Button>
        </TabsContent>

        {/* ── Pricing ─────────────────────────────────────────── */}
        <TabsContent value="pricing" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="price"
              label="Price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="29.99"
            />
            <Input
              id="original-price"
              label="Original / List Price"
              type="number"
              step="0.01"
              value={form.original_price}
              onChange={(e) =>
                setForm((p) => ({ ...p, original_price: e.target.value }))
              }
            />
            <Input
              id="discount-pct"
              label="Discount %"
              type="number"
              min={0}
              max={100}
              value={form.discount_pct}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  discount_pct: parseInt(e.target.value) || 0,
                }))
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

        {/* ── Images ──────────────────────────────────────────── */}
        <TabsContent value="images" className="mt-4 space-y-4">
          <p className="text-sm text-muted">
            Images are imported automatically from Amazon. The first image is
            the primary / thumbnail. You can add URLs manually or remove
            unwanted images.
          </p>

          {form.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {form.images.map((img, i) => (
                <div
                  key={i}
                  className="relative rounded-lg border border-border overflow-hidden group"
                >
                  {img.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img.url}
                      alt={`Product image ${i + 1}`}
                      className="w-full aspect-square object-contain bg-gray-50"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-surface flex items-center justify-center text-muted text-xs">
                      No image
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white">
                      {i === 0 ? "Primary" : img.variant ?? `#${i + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          images: p.images.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="text-xs text-red-300 hover:text-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted italic">
              No images yet. Fetch from Amazon or add a URL below.
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
                if (url) {
                  setForm((p) => ({ ...p, images: [...p.images, { url }] }));
                  setAddImageUrl("");
                }
              }}
            >
              Add URL
            </Button>
          </div>
        </TabsContent>

        {/* ── Specifications ──────────────────────────────────── */}
        {specEntries.length > 0 && (
          <TabsContent value="specs" className="mt-4">
            <p className="mb-3 text-sm text-muted">
              Attributes imported from Amazon. Stored as product metadata.
            </p>
            <dl className="divide-y divide-border rounded-lg border border-border">
              {specEntries.map(([key, value]) => (
                <div key={key} className="flex gap-4 px-4 py-2.5 text-sm">
                  <dt className="w-40 shrink-0 font-medium text-muted capitalize">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="flex-1 text-foreground">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
