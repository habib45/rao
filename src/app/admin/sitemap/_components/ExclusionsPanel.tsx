"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

export function ExclusionsPanel() {
  const qc = useQueryClient();
  const [input, setInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sitemap-exclusions"],
    queryFn: async () => {
      const res = await fetch("/admin/api/sitemap/exclusions");
      if (!res.ok) throw new Error("Failed to load exclusions");
      return res.json() as Promise<{ slugs: string[] }>;
    },
  });

  const slugs = data?.slugs ?? [];

  const addMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch("/admin/api/sitemap/exclusions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: slug }),
      });
      if (!res.ok) throw new Error("Failed to add exclusion");
    },
    onSuccess: () => {
      toast.success("Exclusion added.");
      setInput("");
      qc.invalidateQueries({ queryKey: ["sitemap-exclusions"] });
    },
    onError: () => toast.error("Failed to add exclusion."),
  });

  const removeMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch("/admin/api/sitemap/exclusions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: slug }),
      });
      if (!res.ok) throw new Error("Failed to remove exclusion");
    },
    onSuccess: () => {
      toast.success("Exclusion removed.");
      qc.invalidateQueries({ queryKey: ["sitemap-exclusions"] });
    },
    onError: () => toast.error("Failed to remove exclusion."),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const slug = input.trim();
    if (!slug) return;
    if (slugs.includes(slug)) {
      toast.error("Slug is already excluded.");
      return;
    }
    addMutation.mutate(slug);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Enter the <code className="rounded bg-surface px-1 py-0.5 text-xs">en</code> slug value of any
        product, category, or blog post to exclude it from the sitemap.
      </p>

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="e.g. old-product-slug"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || addMutation.isPending}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      ) : slugs.length === 0 ? (
        <p className="text-sm text-muted italic">No exclusions configured.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slugs.map((slug) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground"
            >
              {slug}
              <button
                onClick={() => removeMutation.mutate(slug)}
                className="text-muted hover:text-red-500"
                aria-label={`Remove ${slug}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
