"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ClassicEditor } from "ckeditor5";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  GripVertical,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import { Dialog } from "@/app/admin/_components/ui/dialog";
import { Badge } from "@/app/admin/_components/ui/badge";
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
  /** Local key for React + drag tracking. */
  key: string;
  url: string;
  width?: number;
  height?: number;
  variant?: string;
  /** Where this image came from — affects cleanup and provenance display. */
  source: "amazon" | "manual" | "upload" | "picker";
  alt?: Record<string, string>;
  uploading?: boolean;
  uploadError?: string | null;
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bulkAltText, setBulkAltText] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      images:
        preview.images.length > 0
          ? preview.images.map((img, i) => ({
              key: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
              url: img.url,
              width: img.width,
              height: img.height,
              variant: img.variant,
              source: "amazon" as const,
              alt: {},
            }))
          : prev.images,
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

  // ── Image helpers ──────────────────────────────────────────────
  const makeKey = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const validUrl = (raw: string): string | null => {
    const s = raw.trim();
    if (!s) return null;
    try {
      const u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      return u.toString();
    } catch {
      return null;
    }
  };

  const appendImages = useCallback(
    (newOnes: Array<{ url: string; source: ImageEntry["source"]; variant?: string }>) => {
      setForm((p) => {
        const seen = new Set(p.images.map((i) => i.url));
        const additions: ImageEntry[] = newOnes
          .filter((n) => !seen.has(n.url))
          .map((n) => ({
            key: makeKey(),
            url: n.url,
            variant: n.variant,
            source: n.source,
            alt: {},
          }));
        if (additions.length === 0) return p;
        return { ...p, images: [...p.images, ...additions] };
      });
    },
    [],
  );

  function addImageByUrl(raw: string) {
    const url = validUrl(raw);
    if (!url) {
      toast.error("Enter a valid http(s) URL");
      return;
    }
    appendImages([{ url, source: "manual" }]);
    setAddImageUrl("");
  }

  function moveImage(from: number, to: number) {
    setForm((p) => {
      if (from === to || from < 0 || to < 0 || from >= p.images.length) return p;
      const next = p.images.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return { ...p, images: next };
    });
  }

  function setPrimary(index: number) {
    // The first image is treated as primary downstream (see `validImages` in submit).
    // Moving the chosen slot to index 0 is enough — no per-row is_primary needed.
    if (index === 0) return;
    moveImage(index, 0);
    toast.success("Primary image updated");
  }

  function removeImage(index: number) {
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  }

  function updateAlt(index: number, locale: LocaleCode, value: string) {
    setForm((p) => ({
      ...p,
      images: p.images.map((img, i) =>
        i === index ? { ...img, alt: { ...(img.alt ?? {}), [locale]: value } } : img,
      ),
    }));
  }

  function applyBulkAlt() {
    const text = bulkAltText.trim();
    if (!text) return;
    setForm((p) => ({
      ...p,
      images: p.images.map((img) => ({
        ...img,
        alt: { ...(img.alt ?? {}), en: text },
      })),
    }));
    setBulkAltText("");
    toast.success("Alt text applied to all images (EN)");
  }

  function clearAllImages() {
    if (form.images.length === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remove all ${form.images.length} images? This cannot be undone.`)
    ) {
      return;
    }
    setForm((p) => ({ ...p, images: [] }));
  }

  // ── File upload ──────────────────────────────────────────────────
  async function uploadFiles(fileList: FileList | File[]) {
    const allFiles = Array.from(fileList);
    const files = allFiles.filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("Please select image files only");
      return;
    }
    // Warn for non-image files but don't abort the whole batch — the
    // user probably just dropped a folder of mixed files and would
    // rather see the images upload than have the whole selection
    // rejected.
    const skippedNonImages = allFiles.length - files.length;
    if (skippedNonImages > 0) {
      toast.error(`Skipped ${skippedNonImages} non-image file${skippedNonImages === 1 ? "" : "s"}`);
    }

    // Split into uploadable and oversized. We surface oversize warnings
    // up front and continue to upload the rest of the batch instead of
    // aborting on the first oversized file (which used to silently drop
    // every file after it).
    const MAX_BYTES = 10 * 1024 * 1024;
    const accepted: File[] = [];
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} exceeds 10 MB limit`);
      } else {
        accepted.push(f);
      }
    }
    if (accepted.length === 0) return;

    // Optimistic placeholders.
    const placeholders: ImageEntry[] = accepted.map(() => ({
      key: makeKey(),
      url: "",
      source: "upload" as const,
      alt: {},
      uploading: true,
      uploadError: null,
    }));
    setForm((p) => ({ ...p, images: [...p.images, ...placeholders] }));

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i]!;
      const placeholderKey = placeholders[i]!.key;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");
      try {
        const res = await fetch("/admin/api/public-media/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(err?.error ?? `Upload failed (${res.status})`);
        }
        const data = (await res.json()) as { paths?: string[] };
        const url = data.paths?.[0];
        if (!url) throw new Error("Upload returned no path");
        setForm((p) => ({
          ...p,
          images: p.images.map((img) =>
            img.key === placeholderKey
              ? { ...img, url, uploading: false, uploadError: null }
              : img,
          ),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setForm((p) => ({
          ...p,
          images: p.images.map((img) =>
            img.key === placeholderKey
              ? { ...img, uploading: false, uploadError: message }
              : img,
          ),
        }));
        toast.error(`${file.name}: ${message}`);
      }
    }
  }

  // ── DnD reorder ──────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers need text/plain to actually start a drag.
    e.dataTransfer.setData("text/plain", String(index));
  }
  function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  }
  function handleDragLeave() {
    setDropIndex(null);
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const from = Number(raw);
    if (Number.isFinite(from)) moveImage(from, index);
    setDraggingIndex(null);
    setDropIndex(null);
  }
  function handleDragEnd() {
    setDraggingIndex(null);
    setDropIndex(null);
  }

  // ── Paste from clipboard ────────────────────────────────────────
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    const files: File[] = [];
    for (const it of Array.from(items)) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f && f.type.startsWith("image/")) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      void uploadFiles(files);
    }
  }

  // ── File drop on the zone ───────────────────────────────────────
  function handleZoneDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) void uploadFiles(files);
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
                  onReady={(editor: unknown) => { editorRefs.current[code] = editor as ClassicEditor | null; }}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-muted max-w-2xl">
              Images are imported automatically from Amazon. The first image is
              the primary / thumbnail. Drag to reorder, click the star to set
              primary, and use the toolbar to upload new files, paste from
              clipboard, or pick from the media library.
            </p>
            {form.images.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="info">
                  {form.images.length} image{form.images.length === 1 ? "" : "s"}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllImages}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleZoneDrop}
            className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
              isDragOver
                ? "border-brand bg-brand/5"
                : "border-border bg-surface/40"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Upload className="h-4 w-4 text-muted" />
              <span className="text-sm text-muted">
                Drop image files here, paste from clipboard (Ctrl/⌘+V), or:
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    void uploadFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload files
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setPickerOpen(true)}
              >
                <ImagePlus className="h-3.5 w-3.5 mr-1" /> Pick from media
              </Button>
            </div>
          </div>

          {/* Image grid */}
          {form.images.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {form.images.map((img, i) => (
                <ImageCard
                  key={img.key}
                  img={img}
                  index={i}
                  isPrimary={i === 0}
                  isDragging={draggingIndex === i}
                  isDropTarget={dropIndex === i && draggingIndex !== i}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  onMoveUp={() => moveImage(i, i - 1)}
                  onMoveDown={() => moveImage(i, i + 1)}
                  onSetPrimary={() => setPrimary(i)}
                  onRemove={() => removeImage(i)}
                  onAltChange={(locale, value) => updateAlt(i, locale, value)}
                  onPaste={handlePaste}
                  isFirst={i === 0}
                  isLast={i === form.images.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-surface/30 p-8 text-center">
              <ImagePlus className="h-8 w-8 mx-auto text-muted mb-2" />
              <p className="text-sm text-muted">
                No images yet. Fetch from Amazon, drop files here, or add a URL
                below.
              </p>
            </div>
          )}

          {/* Bulk alt text */}
          {form.images.length > 0 && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-xs">
                  Bulk alt text (EN)
                </Badge>
                <span className="text-xs text-muted">
                  Applies the same alt text to every image in English.
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={bulkAltText}
                  onChange={(e) => setBulkAltText(e.target.value)}
                  placeholder="Describe the product for SEO / accessibility"
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={applyBulkAlt}
                  disabled={!bulkAltText.trim()}
                >
                  Apply to all
                </Button>
              </div>
            </div>
          )}

          {/* Manual URL add */}
          <div className="flex gap-2">
            <Input
              id="add-image-url"
              value={addImageUrl}
              onChange={(e) => setAddImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImageByUrl(addImageUrl);
                }
              }}
              placeholder="https://m.media-amazon.com/images/..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addImageByUrl(addImageUrl)}
            >
              <LinkIcon className="h-3.5 w-3.5 mr-1" /> Add URL
            </Button>
          </div>

          {/* Media picker dialog */}
          <MediaPickerDialog
            open={pickerOpen}
            onClose={(url) => {
              setPickerOpen(false);
              if (url) appendImages([{ url, source: "picker" }]);
            }}
          />
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

// ────────────────────────────────────────────────────────────────────────────
// ImageCard — single product image with drag, reorder, primary, alt, remove
// ────────────────────────────────────────────────────────────────────────────

const LOCALE_TABS: Array<{ code: LocaleCode; label: string }> = [
  { code: "en", label: "EN" },
  { code: "bn-BD", label: "BN" },
  { code: "sv", label: "SV" },
];

interface ImageCardProps {
  img: ImageEntry;
  index: number;
  isPrimary: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetPrimary: () => void;
  onRemove: () => void;
  onAltChange: (locale: LocaleCode, value: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  isFirst: boolean;
  isLast: boolean;
}

function ImageCard(props: ImageCardProps) {
  const [altOpen, setAltOpen] = useState(false);
  const {
    img,
    index,
    isPrimary,
    isDragging,
    isDropTarget,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onMoveUp,
    onMoveDown,
    onSetPrimary,
    onRemove,
    onAltChange,
    onPaste,
    isFirst,
    isLast,
  } = props;

  function confirmRemove() {
    if (typeof window === "undefined") return;
    if (window.confirm("Remove this image?")) onRemove();
  }

  return (
    <div
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onPaste={onPaste}
      className={`relative rounded-lg border bg-surface overflow-hidden transition-all ${
        isDragging ? "opacity-40 scale-95" : ""
      } ${isDropTarget ? "border-brand ring-2 ring-brand" : "border-border"}`}
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-surface/60">
        <div className="flex items-center gap-1 text-xs">
          <GripVertical className="h-3.5 w-3.5 text-muted cursor-grab active:cursor-grabbing" />
          <span className="font-mono text-muted">#{index + 1}</span>
          {isPrimary && (
            <Badge variant="success" className="ml-1 text-[10px]">
              Primary
            </Badge>
          )}
          {img.source === "amazon" && (
            <Badge variant="info" className="ml-1 text-[10px]">
              Amazon
            </Badge>
          )}
          {img.source === "upload" && (
            <Badge variant="info" className="ml-1 text-[10px]">
              Uploaded
            </Badge>
          )}
          {img.source === "picker" && (
            <Badge variant="default" className="ml-1 text-[10px]">
              Library
            </Badge>
          )}
          {img.source === "manual" && (
            <Badge variant="default" className="ml-1 text-[10px]">
              Manual
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Move up"
            disabled={isFirst}
            onClick={onMoveUp}
            className="p-1 rounded hover:bg-surface disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={isLast}
            onClick={onMoveDown}
            className="p-1 rounded hover:bg-surface disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Set as primary"
            onClick={onSetPrimary}
            disabled={isPrimary}
            className="p-1 rounded hover:bg-surface disabled:opacity-30"
            title="Set as primary"
          >
            <Star className={`h-3.5 w-3.5 ${isPrimary ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </button>
          <button
            type="button"
            aria-label="Toggle alt text"
            onClick={() => setAltOpen((v) => !v)}
            className="p-1 rounded hover:bg-surface"
            title="Alt text"
          >
            <Badge variant={altOpen ? "info" : "default"} className="text-[10px]">
              ALT
            </Badge>
          </button>
          <button
            type="button"
            aria-label="Remove image"
            onClick={confirmRemove}
            className="p-1 rounded hover:bg-red-100 text-red-600"
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="aspect-square bg-gray-50 relative">
        {img.uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : img.url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={img.url}
            alt={img.alt?.en ?? `Product image ${index + 1}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
            No image
          </div>
        )}
        {img.uploadError && (
          <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-xs p-1.5">
            {img.uploadError}
          </div>
        )}
      </div>

      {/* URL */}
      <div className="px-2 py-1.5 text-[11px] text-muted truncate" title={img.url || "(pending upload)"}>
        {img.url ? img.url.replace(/^https?:\/\//, "") : "(pending upload)"}
      </div>

      {/* Alt text panel */}
      {altOpen && (
        <div className="border-t border-border bg-surface/40 px-2 py-2 space-y-1.5">
          {LOCALE_TABS.map(({ code, label }) => (
            <div key={code} className="flex items-center gap-1.5">
              <span className="w-8 text-[10px] font-mono text-muted">{label}</span>
              <Input
                value={img.alt?.[code] ?? ""}
                onChange={(e) => onAltChange(code, e.target.value)}
                placeholder="Alt text"
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MediaPickerDialog — minimal picker for Phase 21 public-media
// ────────────────────────────────────────────────────────────────────────────

interface MediaPickerDialogProps {
  open: boolean;
  onClose: (url?: string) => void;
}

function MediaPickerDialog({ open, onClose }: MediaPickerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<
    Array<{ name: string; url: string; isFolder: boolean; path: string }>
  >([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [folder, setFolder] = useState("products");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/admin/api/public-media?folder=${encodeURIComponent(folder)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load (${r.status})`);
        return r.json();
      })
      .then(
        (data: {
          items?: Array<{
            name: string;
            publicUrl: string | null;
            isFolder: boolean;
            path: string;
          }>;
        }) => {
          if (cancelled) return;
          // The API returns `publicUrl` (and `path` / `isFolder`) — map
          // `publicUrl` to the local `url` field so the rest of the UI
          // can use a single shape. Folders have `publicUrl === null`
          // and are still listed so users can drill into sub-folders.
          setItems(
            (data.items ?? []).map((it) => ({
              name: it.name,
              url: it.publicUrl ?? "",
              isFolder: it.isFolder,
              path: it.path,
            })),
          );
        },
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load media");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, folder]);

  const imageItems = items.filter((it) => !it.isFolder && it.url);

  return (
    <Dialog
      open={open}
      onClose={() => onClose(undefined)}
      title="Pick from media library"
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="Folder name (e.g. products)"
            className="flex-1"
          />
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && imageItems.length === 0 && (
          <p className="text-sm text-muted italic">
            No files in this folder. Upload files in the Media page first.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto sm:grid-cols-4">
          {imageItems.map((it) => (
            <button
              key={it.url}
              type="button"
              onClick={() => setPicked(it.url)}
              className={`relative rounded-md overflow-hidden border-2 aspect-square ${
                picked === it.url ? "border-brand" : "border-border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={it.name} className="w-full h-full object-contain bg-gray-50" />
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={() => onClose(undefined)}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!picked}
            onClick={() => onClose(picked ?? undefined)}
          >
            Choose
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
