"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";
import type { RobotsRule } from "@/app/admin/_lib/schemas/sitemap";

export function RobotsEditor() {
  const [rules, setRules] = useState<RobotsRule[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["robots-config"],
    queryFn: async () => {
      const res = await fetch("/admin/api/sitemap/robots");
      if (!res.ok) throw new Error("Failed to load robots config");
      return res.json() as Promise<{ rules: RobotsRule[] }>;
    },
  });

  useEffect(() => {
    if (data?.rules) setRules(data.rules);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { rules: RobotsRule[] }) => {
      const res = await fetch("/admin/api/sitemap/robots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => toast.success("Robots rules saved."),
    onError: (e: Error) => toast.error(e.message),
  });

  function addRule() {
    setRules((r) => [...r, { userAgent: "*", allow: ["/"], disallow: [] }]);
  }

  function removeRule(i: number) {
    setRules((r) => r.filter((_, idx) => idx !== i));
  }

  function updateAgent(i: number, value: string) {
    setRules((r) => r.map((rule, idx) => idx === i ? { ...rule, userAgent: value } : rule));
  }

  function updatePaths(i: number, field: "allow" | "disallow", paths: string[]) {
    setRules((r) => r.map((rule, idx) => idx === i ? { ...rule, [field]: paths } : rule));
  }

  function addPath(i: number, field: "allow" | "disallow") {
    setRules((r) =>
      r.map((rule, idx) =>
        idx === i ? { ...rule, [field]: [...rule[field], ""] } : rule
      )
    );
  }

  function removePath(i: number, field: "allow" | "disallow", j: number) {
    setRules((r) =>
      r.map((rule, idx) =>
        idx === i ? { ...rule, [field]: rule[field].filter((_, pi) => pi !== j) } : rule
      )
    );
  }

  function updatePath(i: number, field: "allow" | "disallow", j: number, value: string) {
    setRules((r) =>
      r.map((rule, idx) =>
        idx === i
          ? { ...rule, [field]: rule[field].map((p, pi) => pi === j ? value : p) }
          : rule
      )
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Configure crawl rules for search engine bots. The sitemap URL is always appended automatically.
        </p>
        <a
          href="/robots.txt"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
        >
          Preview robots.txt <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-3">
        {rules.map((rule, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted">User-agent</label>
                <input
                  type="text"
                  value={rule.userAgent}
                  onChange={(e) => updateAgent(i, e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 w-40"
                />
              </div>
              {rules.length > 1 && (
                <button
                  onClick={() => removeRule(i)}
                  className="text-muted hover:text-red-500"
                  aria-label="Remove rule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {(["allow", "disallow"] as const).map((field) => (
              <div key={field}>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-xs font-medium text-muted capitalize">{field}</label>
                  <button
                    onClick={() => addPath(i, field)}
                    className="text-muted hover:text-brand"
                    aria-label={`Add ${field} path`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {rule[field].map((path, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={path}
                        onChange={(e) => updatePath(i, field, j, e.target.value)}
                        className="h-8 flex-1 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                      />
                      <button
                        onClick={() => removePath(i, field, j)}
                        className="text-muted hover:text-red-500"
                        aria-label="Remove path"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {rule[field].length === 0 && (
                    <p className="text-xs text-muted italic">No {field} rules.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={addRule}>
          <Plus className="h-4 w-4" /> Add User-agent Rule
        </Button>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate({ rules })}
          disabled={saveMutation.isPending || rules.length === 0}
        >
          {saveMutation.isPending ? "Saving…" : "Save Rules"}
        </Button>
      </div>
    </div>
  );
}

