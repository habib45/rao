"use client";

import { Plus, ChevronDown, ChevronUp } from "lucide-react";

interface MediaPageHeaderProps {
  onCreateBucket: () => void;
  onToggleBuckets: () => void;
  showBuckets: boolean;
}

function MediaPageHeader({
  onCreateBucket,
  onToggleBuckets,
  showBuckets,
}: MediaPageHeaderProps) {
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

export { MediaPageHeader };
