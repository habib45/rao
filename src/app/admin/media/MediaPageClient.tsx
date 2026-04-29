"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Folder,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";

type Bucket = {
  id: string;
  name: string;
  public: boolean;
  created_at: string;
  updated_at: string;
};

type MediaItem = {
  name: string;
  path: string;
  publicUrl: string | null;
  size: number | null;
  updatedAt: string | null;
  createdAt: string | null;
  isFolder: boolean;
};

function formatSize(size: number | null) {
  if (size === null) {
    return "—";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaPageHeader({
  onCreateBucket,
  onToggleBuckets,
  showBuckets,
}: {
  onCreateBucket: () => void;
  onToggleBuckets: () => void;
  showBuckets: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          Admin
        </p>
        <h1 className="text-2xl font-semibold">Media</h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-sm text-muted">
          Manage your media library with Supabase Storage buckets.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCreateBucket}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Bucket
          </button>

          <button
            type="button"
            onClick={onToggleBuckets}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted"
          >
            {showBuckets ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Hide Buckets
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show Buckets
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaManagerContent({
  buckets,
  selectedBucket,
  setSelectedBucket,
  files,
  loading,
  error,
  uploading,
  setUploading,
  showBucketModal,
  setShowBucketModal,
  showBucketsSection,
  onRefresh,
  newBucketName,
  setNewBucketName,
  creatingBucket,
  onCreateBucket,
}: {
  buckets: Bucket[];
  selectedBucket: string;
  setSelectedBucket: (bucket: string) => void;
  files?: MediaItem[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  showBucketModal: boolean;
  setShowBucketModal: (show: boolean) => void;
  showBucketsSection: boolean;
  onRefresh: () => void;
  newBucketName: string;
  setNewBucketName: (name: string) => void;
  creatingBucket: boolean;
  onCreateBucket: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const safeFiles = useMemo(() => files ?? [], [files]);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const hasImages = useMemo(
    () => safeFiles.some((file) => !file.isFolder),
    [safeFiles],
  );

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("file", selectedFiles[i]);
    }
    formData.append("bucket", selectedBucket);

    try {
      const response = await fetch("/admin/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Upload failed");
      }

      onRefresh();
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = useCallback((item: MediaItem) => {
    if (!item.publicUrl) return;
    void navigator.clipboard.writeText(item.publicUrl).then(() => {
      setCopiedPath(item.path);
      setTimeout(() => setCopiedPath(null), 2000);
    });
  }, []);

  const handleDeleteFile = async (path: string) => {
    if (!confirm(`Delete "${path}"?`)) {
      return;
    }

    try {
      const response = await fetch("/admin/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: selectedBucket, path }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Delete failed");
      }

      onRefresh();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleDeleteBucket = async (bucketId: string) => {
    const bucket = buckets.find((b) => b.id === bucketId);
    if (!bucket) return;

    if (!confirm(`Delete bucket "${bucket.name}" and all its contents?`)) {
      return;
    }

    try {
      const response = await fetch(`/admin/api/media/buckets?id=${bucketId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Delete failed");
      }

      onRefresh();
    } catch (err) {
      console.error("Delete bucket error:", err);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold">Media library</h2>
            <p className="max-w-xl text-sm text-muted">
              Browse and upload images for product pages, banners, and marketing
              assets.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.name} ({bucket.public ? "public" : "private"})
                </option>
              ))}
            </select>

            <label className="inline-flex cursor-pointer items-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">
              <span>{uploading ? "Uploading…" : "Upload images"}</span>
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
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
              onClick={onRefresh}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {showBucketsSection && (
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-md font-semibold mb-4">Available Buckets</h3>
          {buckets.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <Folder className="mx-auto h-12 w-12 text-muted mb-2" />
              <p>No buckets found. Create your first bucket above.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="group relative flex flex-col items-center rounded-lg border border-border bg-background p-4 shadow-sm transition hover:shadow-md hover:border-brand/20"
                >
                  <div className="mb-3">
                    <Folder className="h-12 w-12 text-brand" />
                  </div>
                  <div className="text-center">
                    <p
                      className="font-medium text-sm truncate w-full"
                      title={bucket.name}
                    >
                      {bucket.name}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {bucket.public ? "Public" : "Private"}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(bucket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="absolute top-2 right-2 rounded-full bg-destructive/10 p-1.5 text-destructive opacity-0 transition group-hover:opacity-100 hover:bg-destructive hover:text-white"
                    onClick={() => handleDeleteBucket(bucket.id)}
                    title={`Delete bucket ${bucket.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error ? (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-border bg-surface p-8 text-sm text-muted">
          Loading media...
        </div>
      ) : safeFiles.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-8 text-sm text-muted">
          No media files found in bucket &ldquo;{selectedBucket}&rdquo;. Upload
          one or more images to populate the library.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {safeFiles.map((item) => (
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
                  />
                ) : item.isFolder ? (
                  <div className="flex h-full items-center justify-center text-muted">
                    <Folder className="h-14 w-14 text-brand" />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    Preview unavailable
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString()
                        : "Unknown date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground transition hover:bg-brand hover:text-white hover:border-brand disabled:opacity-40"
                      onClick={() => handleCopyUrl(item)}
                      title="Copy image URL"
                      disabled={!item.publicUrl}
                    >
                      {copiedPath === item.path ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-border bg-background p-1.5 text-destructive transition hover:bg-destructive hover:text-white hover:border-destructive"
                      onClick={() => handleDeleteFile(item.path)}
                      title={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  Size: {formatSize(item.size)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !hasImages ? (
        <div className="rounded-3xl border border-border bg-surface p-4 text-sm text-muted">
          Only folders were found in this bucket. Upload images to display them
          in the gallery.
        </div>
      ) : null}

      {/* Bucket Creation Modal */}
      {showBucketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Create New Bucket</h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="bucket-name"
                  className="block text-sm font-medium mb-2"
                >
                  Bucket Name
                </label>
                <input
                  id="bucket-name"
                  type="text"
                  placeholder="Enter bucket name"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !creatingBucket &&
                      newBucketName.trim()
                    ) {
                      onCreateBucket();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBucketModal(false);
                    setNewBucketName("");
                  }}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onCreateBucket}
                  disabled={creatingBucket || !newBucketName.trim()}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                  {creatingBucket ? "Creating…" : "Create Bucket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function MediaPageClient() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>("media");
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showBucketsSection, setShowBucketsSection] = useState(false);

  const loadBuckets = useCallback(async () => {
    try {
      const response = await fetch("/admin/api/media/buckets");
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to load buckets");
      }

      const payload = (await response.json()) as { buckets: Bucket[] };
      setBuckets(payload.buckets);

      // Set default selected bucket if available
      if (
        payload.buckets.length > 0 &&
        !payload.buckets.find((b) => b.id === selectedBucket)
      ) {
        setSelectedBucket(payload.buckets[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load buckets");
    }
  }, [selectedBucket]);

  const loadFiles = useCallback(async () => {
    if (!selectedBucket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/admin/api/media?bucket=${selectedBucket}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to load files");
      }

      const payload = (await response.json()) as { items: MediaItem[] };
      setFiles(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [selectedBucket]);

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      return;
    }

    setCreatingBucket(true);
    setError(null);

    try {
      const response = await fetch("/admin/api/media/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBucketName.trim(), public: true }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to create bucket");
      }

      setNewBucketName("");
      setShowBucketModal(false);
      await loadBuckets();
      setSelectedBucket(newBucketName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bucket creation failed");
    } finally {
      setCreatingBucket(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const handleCreateBucketClick = useCallback(() => {
    setShowBucketModal(true);
  }, []);

  const handleToggleBuckets = useCallback(() => {
    setShowBucketsSection((prev) => !prev);
  }, []);

  useEffect(() => {
    void loadBuckets();
  }, [loadBuckets]);

  useEffect(() => {
    if (selectedBucket) {
      void loadFiles();
    }
  }, [loadFiles, refreshKey, selectedBucket]);

  return (
    <div className="space-y-6">
      <MediaPageHeader
        onCreateBucket={handleCreateBucketClick}
        onToggleBuckets={handleToggleBuckets}
        showBuckets={showBucketsSection}
      />

      <MediaManagerContent
        buckets={buckets}
        selectedBucket={selectedBucket}
        setSelectedBucket={setSelectedBucket}
        files={files}
        loading={loading}
        error={error}
        uploading={uploading}
        setUploading={setUploading}
        showBucketModal={showBucketModal}
        setShowBucketModal={setShowBucketModal}
        showBucketsSection={showBucketsSection}
        onRefresh={handleRefresh}
        newBucketName={newBucketName}
        setNewBucketName={setNewBucketName}
        creatingBucket={creatingBucket}
        onCreateBucket={handleCreateBucket}
      />
    </div>
  );
}
