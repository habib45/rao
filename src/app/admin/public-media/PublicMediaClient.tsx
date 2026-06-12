"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Folder, Trash2, Copy, Check, Plus, ChevronRight, RefreshCw, Upload, X, ChevronDown } from "lucide-react";

type MediaItem = {
  name: string;
  path: string;
  publicUrl: string | null;
  size: number | null;
  sizeFormatted: string | null;
  isFolder: boolean;
  updatedAt: string | null;
};

export function PublicMediaClient() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUrlOptions, setShowUrlOptions] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/admin/api/public-media?folder=${encodeURIComponent(currentFolder)}`,
      );
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error ?? "Failed to load media");
      }
      const payload = (await res.json()) as { items: MediaItem[] };
      setItems(payload.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUrlOptions) {
        const target = event.target as Element;
        if (!target.closest('.url-options-container')) {
          setShowUrlOptions(null);
        }
      }
    };

    if (showUrlOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUrlOptions]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => formData.append("file", file));
      formData.append("folder", currentFolder);

      const res = await fetch("/admin/api/public-media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error ?? "Upload failed");
      }

      setRefreshKey((k) => k + 1);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getUrlFormats = useCallback((item: MediaItem) => {
    if (!item.publicUrl) return [];
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const cdnUrl = `https://cdn.yourdomain.com${item.publicUrl.replace('/uploads', '')}`;
    
    return [
      { label: 'Relative URL', value: item.publicUrl },
      { label: 'Absolute URL', value: `${baseUrl}${item.publicUrl}` },
      { label: 'CDN URL', value: cdnUrl },
      { label: 'HTML img tag', value: `<img src="${item.publicUrl}" alt="${item.name}" />` },
      { label: 'Markdown', value: `![${item.name}](${item.publicUrl})` },
    ];
  }, []);

  const handleCopyUrl = useCallback((item: MediaItem, format: string) => {
    const formats = getUrlFormats(item);
    const selectedFormat = formats.find(f => f.label === format);
    if (!selectedFormat) return;
    
    void navigator.clipboard.writeText(selectedFormat.value).then(() => {
      setCopiedPath(`${item.path}-${format}`);
      setTimeout(() => setCopiedPath(null), 2000);
      setShowUrlOptions(null);
    });
  }, [getUrlFormats]);

  const handleDelete = async (item: MediaItem) => {
    if (item.isFolder) return;
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    setError(null);
    try {
      const res = await fetch(
        `/admin/api/public-media?path=${encodeURIComponent(item.path)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error ?? "Delete failed");
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleCreateFolder = async () => {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(newFolderName.trim())) return;

    setCreatingFolder(true);
    setError(null);
    try {
      const res = await fetch(
        `/admin/api/public-media?folder=${encodeURIComponent(currentFolder)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderName: newFolderName.trim() }),
        },
      );
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error ?? "Failed to create folder");
      }
      setNewFolderName("");
      setShowCreateFolder(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const navigateTo = (folder: string) => {
    setCurrentFolder(folder);
    setItems([]);
  };

  const breadcrumbs = ["uploads", ...currentFolder.split("/").filter(Boolean)];

  const imageItems = items.filter((i) => !i.isFolder);
  const folderItems = items.filter((i) => i.isFolder);

  return (
    <section className="space-y-6">
      {/* Header card */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold">Public Media</h2>
            <p className="max-w-xl text-sm text-muted">
              Files stored in{" "}
              <code className="rounded bg-muted/20 px-1 py-0.5 font-mono text-xs">
                public/uploads/
              </code>{" "}
              and served statically at{" "}
              <code className="rounded bg-muted/20 px-1 py-0.5 font-mono text-xs">
                /uploads/…
              </code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              aria-label="Upload images to public folder"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload images"}
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                multiple
                accept="image/*"
                disabled={uploading}
                onChange={handleUpload}
              />
            </label>

            <button
              type="button"
              onClick={() => setShowCreateFolder(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
              aria-label="Create new folder"
            >
              <Plus className="h-4 w-4" />
              New Folder
            </button>

            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-surface"
              aria-label="Refresh file list"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav aria-label="Folder navigation" className="flex items-center gap-1 text-sm text-muted">
        {breadcrumbs.map((segment, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const targetFolder = breadcrumbs
            .slice(1, index + 1)
            .join("/");

          return (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {isLast ? (
                <span className="font-medium text-foreground">{segment}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo(targetFolder)}
                  className="hover:text-foreground hover:underline"
                >
                  {segment}
                </button>
              )}
            </span>
          );
        })}
      </nav>

      {/* Error */}
      {error ? (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Content */}
      {loading ? (
        <div className="rounded-3xl border border-border bg-surface p-8 text-sm text-muted">
          Loading media…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-8 text-center text-sm text-muted">
          <Upload className="mx-auto mb-2 h-10 w-10 opacity-30" />
          <p>No media files in this folder. Upload images or create a sub-folder.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Folder cards */}
          {folderItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigateTo(item.path)}
              className="group flex flex-col items-center rounded-3xl border border-border bg-background p-6 shadow-sm transition hover:border-brand/30 hover:shadow-md"
              aria-label={`Open folder ${item.name}`}
            >
              <Folder className="mb-3 h-12 w-12 text-brand transition group-hover:scale-105" />
              <p className="w-full truncate text-center text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-muted">Folder</p>
            </button>
          ))}

          {/* Image cards */}
          {imageItems.map((item) => (
            <article
              key={item.path}
              className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm"
            >
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                {item.publicUrl ? (
                  <Image
                    src={item.publicUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    Preview unavailable
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" title={item.name}>
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{item.sizeFormatted ?? "—"}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="relative url-options-container">
                      <button
                        type="button"
                        onClick={() => setShowUrlOptions(showUrlOptions === item.path ? null : item.path)}
                        disabled={!item.publicUrl}
                        aria-label={`Copy URL options for ${item.name}`}
                        title="Copy URL options"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium transition hover:border-brand hover:bg-brand hover:text-white disabled:opacity-40"
                      >
                        {copiedPath?.startsWith(item.path) ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy URL</span>
                            <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>

                      {showUrlOptions === item.path && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-border bg-surface shadow-lg">
                          <div className="p-1">
                            {getUrlFormats(item).map((format) => (
                              <button
                                key={format.label}
                                type="button"
                                onClick={() => handleCopyUrl(item, format.label)}
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground transition hover:bg-muted/20"
                              >
                                {format.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      aria-label={`Delete ${item.name}`}
                      title="Delete"
                      className="rounded-lg border border-border bg-background p-1.5 text-destructive transition hover:border-destructive hover:bg-destructive hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {item.updatedAt ? (
                  <p className="text-xs text-muted">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                ) : null}

                {item.publicUrl ? (
                  <p className="truncate font-mono text-xs text-muted" title={item.publicUrl}>
                    {item.publicUrl}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create folder modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Folder</h3>
              <button
                type="button"
                onClick={() => { setShowCreateFolder(false); setNewFolderName(""); }}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-muted hover:bg-muted/20 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="folder-name" className="mb-2 block text-sm font-medium">
                  Folder name
                </label>
                <input
                  id="folder-name"
                  ref={folderInputRef}
                  autoFocus
                  type="text"
                  placeholder="e.g. banners"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !creatingFolder && newFolderName.trim()) {
                      void handleCreateFolder();
                    }
                    if (e.key === "Escape") { setShowCreateFolder(false); setNewFolderName(""); }
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
                <p className="mt-1 text-xs text-muted">
                  Letters, numbers, dashes, underscores only.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateFolder(false); setNewFolderName(""); }}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateFolder()}
                  disabled={creatingFolder || !/^[a-zA-Z0-9_-]{1,64}$/.test(newFolderName.trim())}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                  {creatingFolder ? "Creating…" : "Create Folder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
