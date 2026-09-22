"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Dialog } from "@/app/admin/_components/ui/dialog";
import { Badge } from "@/app/admin/_components/ui/badge";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

/** Local locale codes mirrored from the project's translation map. */
export type LocaleCode = "en" | "bn-BD" | "sv";

export interface ImageEntry {
  /** Local key for React + drag tracking. */
  key: string;
  /** Supabase bucket / CDN URL. */
  url: string;
  width?: number;
  height?: number;
  variant?: string;
  /** Provenance — affects cleanup rules and badge display. */
  source: "amazon" | "manual" | "upload" | "picker" | "existing";
  alt?: Partial<Record<LocaleCode, string>>;
  uploading?: boolean;
  uploadError?: string | null;
  /** Server-side id; only set for entries that already exist in the DB. */
  id?: string;
  /** Server-side flags (mirrored on save). */
  is_primary?: boolean;
  sort_order?: number;
}

interface ProductImageEditorProps {
  value: ImageEntry[];
  onChange: (next: ImageEntry[]) => void;
  /** Optional: drop a single image by server id (called when the API path
   * succeeds and you want to remove the row from the working list). */
  onRemoveById?: (id: string) => void | Promise<void>;
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

const makeKey = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const validUrl = (raw: string): string | null => {
  const s = raw.trim();
  if (!s) return null;
  // Same-origin static upload path served from `public/uploads/`.
  if (s.startsWith("/uploads/")) return s;
  // Local file reference — POSIX absolute path or `file://` URL.
  // The picker upload flow will turn these into real `/uploads/...` URLs.
  if (s.startsWith("file://")) return s;
  if (/^\/[^\s]+$/.test(s)) return s; // POSIX absolute path
  if (/^[a-zA-Z]:[\\/][^\s]+$/.test(s)) return s; // Windows absolute path
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
};

/**
 * True when the input looks like a local file reference (POSIX or Windows
 * absolute path, or a `file://` URL). Used to decide whether the manual
 * URL add box should fall through to the picker upload flow instead of
 * just appending a literal URL string. Browsers cannot display `file://`
 * URLs from an `http://` page, so we always proxy these through the
 * server-side upload-by-path endpoint.
 */
const isLocalFileRef = (raw: string): boolean => {
  const s = raw.trim();
  if (!s) return false;
  if (s.startsWith("file://")) return true;
  if (/^\/[^\s]+$/.test(s)) return true; // POSIX absolute path
  if (/^[a-zA-Z]:[\\/][^\s]+$/.test(s)) return true; // Windows absolute path
  return false;
};

const appendUnique = (
  current: ImageEntry[],
  newOnes: Array<{ url: string; source: ImageEntry["source"]; variant?: string }>,
): ImageEntry[] => {
  const seen = new Set(current.map((i) => i.url));
  const additions: ImageEntry[] = newOnes
    .filter((n) => !seen.has(n.url))
    .map((n) => ({
      key: makeKey(),
      url: n.url,
      variant: n.variant,
      source: n.source,
      alt: {},
    }));
  return additions.length > 0 ? [...current, ...additions] : current;
};

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

export function ProductImageEditor({
  value,
  onChange,
  onRemoveById,
}: ProductImageEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bulkAltText, setBulkAltText] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [addImageUrl, setAddImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const appendImages = useCallback(
    (newOnes: Array<{ url: string; source: ImageEntry["source"]; variant?: string }>) => {
      onChange(appendUnique(value, newOnes));
    },
    [value, onChange],
  );

  function addImageByUrl(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (isLocalFileRef(trimmed)) {
      // Local file reference — proxy through the server so the image is
      // served from `/uploads/...` (browsers cannot display `file://`
      // URLs from a `http://` page).
      void uploadFromPath(trimmed);
      return;
    }
    const url = validUrl(trimmed);
    if (!url) {
      toast.error("Enter a valid http(s) URL or a local file path");
      return;
    }
    appendImages([{ url, source: "manual" }]);
    setAddImageUrl("");
  }

  // ── Upload from absolute path ──────────────────────────────────
  // Mirrors `uploadFiles` but sends a JSON body `{ path }` to a small
  // server endpoint that reads the file from the local disk and writes
  // it into `public/uploads/<folder>/`. We surface the resulting
  // `/uploads/...` URL just like a multipart upload.
  async function uploadFromPath(absolutePath: string) {
    // Optimistic placeholder so the user sees immediate feedback.
    const placeholder: ImageEntry = {
      key: makeKey(),
      url: "",
      source: "upload" as const,
      alt: {},
      uploading: true,
      uploadError: null,
    };
    let workingValue: ImageEntry[] = [...value, placeholder];
    onChange(workingValue);
    try {
      const res = await fetch("/admin/api/public-media/upload-by-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: absolutePath, folder: "products" }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { paths?: string[] };
      const url = data.paths?.[0];
      if (!url) throw new Error("Upload returned no path");
      const next = workingValue.map((img) =>
        img.key === placeholder.key
          ? { ...img, url, uploading: false, uploadError: null }
          : img,
      );
      workingValue = next;
      onChange(next);
      setAddImageUrl("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(`${absolutePath}: ${message}`);
      const next = workingValue.map((img) =>
        img.key === placeholder.key
          ? { ...img, uploading: false, uploadError: message }
          : img,
      );
      workingValue = next;
      onChange(next);
    }
  }

  function moveImage(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= value.length) return;
    const next = value.slice();
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    onChange(next);
  }

  function setPrimary(index: number) {
    if (index === 0) return;
    moveImage(index, 0);
    toast.success("Primary image updated");
  }

  function removeImage(index: number) {
    const target = value[index];
    if (!target) return;
    // Optimistic UI: drop the image from the working list immediately
    // *before* the server round-trip so the admin sees instant feedback
    // and isn't staring at a stale card while the DELETE request is in
    // flight. If the API call later fails, we re-insert the row at the
    // same position so the UI doesn't drift away from the DB.
    const previousList = value;
    const nextList = value.filter((_, i) => i !== index);
    onChange(nextList);
    if (target.id && onRemoveById) {
      // `onRemoveById` returns void | Promise<void>; the parent signals
      // failure by throwing (handled by `.catch` below). On a successful
      // resolve we keep the optimistic removal in place, because the
      // parent's onError has already toasted on failure and the row is
      // genuinely gone from the DB.
      Promise.resolve(onRemoveById(target.id)).catch(() => {
        // Network / 5xx / etc. Re-insert the row at its original index
        // so the editor stays in sync with the DB. The parent's
        // onError already shows a toast with the actual reason.
        onChange(previousList);
      });
    }
  }

  function updateAlt(index: number, locale: LocaleCode, text: string) {
    onChange(
      value.map((img, i) =>
        i === index ? { ...img, alt: { ...(img.alt ?? {}), [locale]: text } } : img,
      ),
    );
  }

  function applyBulkAlt() {
    const text = bulkAltText.trim();
    if (!text) return;
    onChange(
      value.map((img) => ({
        ...img,
        alt: { ...(img.alt ?? {}), en: text },
      })),
    );
    setBulkAltText("");
    toast.success("Alt text applied to all images (EN)");
  }

  function clearAllImages() {
    if (value.length === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remove all ${value.length} images? This cannot be undone.`)
    ) {
      return;
    }
    onChange([]);
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
    onChange([...value, ...placeholders]);

    // Track the current snapshot of `value` so each upload iteration operates
    // on the latest state rather than the closure captured at call time. This
    // matters because the parent's re-render replaces `value` with the list
    // that contains the optimistic placeholders.
    let workingValue: ImageEntry[] = [...value, ...placeholders];

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
        const next = workingValue.map((img) =>
          img.key === placeholderKey
            ? { ...img, url, uploading: false, uploadError: null }
            : img,
        );
        workingValue = next;
        onChange(next);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(`${file.name}: ${message}`);
        const next = workingValue.map((img) =>
          img.key === placeholderKey
            ? { ...img, uploading: false, uploadError: message }
            : img,
        );
        workingValue = next;
        onChange(next);
      }
    }
  }

  // ── DnD reorder ──────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
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

  function handleZoneDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) void uploadFiles(files);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted max-w-2xl">
          {value.length === 0
            ? "Drag files here, paste from clipboard, or pick from the media library. The first image is the primary / thumbnail."
            : "Drag to reorder, click the star to set primary, and use the toolbar to upload new files, paste from clipboard, or pick from the media library."}
        </p>
        {value.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="info">
              {value.length} image{value.length === 1 ? "" : "s"}
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
          isDragOver ? "border-brand bg-brand/5" : "border-border bg-surface/40"
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
      {value.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((img, i) => (
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
              onAltChange={(locale, text) => updateAlt(i, locale, text)}
              onPaste={handlePaste}
              isFirst={i === 0}
              isLast={i === value.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface/30 p-8 text-center">
          <ImagePlus className="h-8 w-8 mx-auto text-muted mb-2" />
          <p className="text-sm text-muted">
            No images yet. Drop files here, paste from clipboard, or add a URL
            below.
          </p>
        </div>
      )}

      {/* Bulk alt text */}
      {value.length > 0 && (
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

      {/* Manual URL add (also accepts absolute local file paths) */}
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
          placeholder="https://m.media-amazon.com/images/...  or  /absolute/path/to/image.png"
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
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// ImageCard
// ────────────────────────────────────────────────────────────────────

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
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onPaste={onPaste}
      data-testid={`image-card-${index}`}
      className={`relative rounded-lg border bg-surface overflow-hidden transition-all ${
        isDragging ? "opacity-40 scale-95" : ""
      } ${isDropTarget ? "border-brand ring-2 ring-brand" : "border-border"}`}
    >
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
          {img.source === "existing" && (
            <Badge variant="default" className="ml-1 text-[10px]">
              Existing
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
            <Star
              className={`h-3.5 w-3.5 ${isPrimary ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
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

      <div
        className="px-2 py-1.5 text-[11px] text-muted truncate"
        title={img.url || "(pending upload)"}
      >
        {img.url ? img.url.replace(/^https?:\/\//, "") : "(pending upload)"}
      </div>

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

// ────────────────────────────────────────────────────────────────────
// MediaPickerDialog
// ────────────────────────────────────────────────────────────────────

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
              <img
                src={it.url}
                alt={it.name}
                className="w-full h-full object-contain bg-gray-50"
              />
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onClose(undefined)}
          >
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
