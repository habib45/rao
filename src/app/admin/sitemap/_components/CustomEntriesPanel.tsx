"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";
import { CHANGEFREQ_VALUES } from "@/app/admin/_lib/schemas/sitemap";

const SITE_URL = "https://raofinds.com";

type Entry = {
  id: string;
  url: string;
  priority: number;
  changefreq: string;
  last_modified: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

type FormState = {
  url: string;
  priority: number;
  changefreq: string;
  last_modified: string;
  is_active: boolean;
  notes: string;
};

const EMPTY_FORM: FormState = {
  url: SITE_URL + "/",
  priority: 0.5,
  changefreq: "weekly",
  last_modified: "",
  is_active: true,
  notes: "",
};

export function CustomEntriesPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [urlError, setUrlError] = useState("");
  const [currentBaseUrl, setCurrentBaseUrl] = useState(SITE_URL);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/admin/api/sitemap?action=config");
        if (res.ok) {
          const data = await res.json();
          if (data.baseUrl) {
            setCurrentBaseUrl(data.baseUrl);
            setForm(prev => ({ ...prev, url: data.baseUrl + "/" }));
          }
        }
      } catch (error) {
        console.error("Failed to load sitemap config:", error);
      }
    }
    loadConfig();
  }, []);

  const validateUrl = (url: string): string => {
    if (!url.startsWith(currentBaseUrl)) {
      return `URL must start with ${currentBaseUrl}`;
    }
    try {
      new URL(url);
    } catch {
      return "Invalid URL format";
    }
    return "";
  };

  const { data, isLoading } = useQuery({
    queryKey: ["sitemap-custom"],
    queryFn: async () => {
      const res = await fetch("/admin/api/sitemap?action=custom&limit=100");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ entries: Entry[]; total: number }>;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sitemap-custom"] });

  const createMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const res = await fetch("/admin/api/sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          last_modified: payload.last_modified || null,
          notes: payload.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => { toast.success("Entry added."); setShowForm(false); setForm(EMPTY_FORM); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<FormState> }) => {
      const res = await fetch(`/admin/api/sitemap?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          last_modified: payload.last_modified || null,
          notes: payload.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => { toast.success("Entry updated."); setEditing(null); setForm(EMPTY_FORM); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/admin/api/sitemap?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => { toast.success("Entry deleted."); invalidate(); },
    onError: () => toast.error("Failed to delete entry."),
  });

  function openEdit(entry: Entry) {
    setEditing(entry);
    setForm({
      url: entry.url,
      priority: entry.priority,
      changefreq: entry.changefreq,
      last_modified: entry.last_modified?.split("T")[0] ?? "",
      is_active: entry.is_active,
      notes: entry.notes ?? "",
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setUrlError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url.startsWith(SITE_URL)) {
      setUrlError(`URL must start with ${SITE_URL}`);
      return;
    }
    setUrlError("");
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Manually add URLs to the sitemap (e.g. landing pages, promotions).
        </p>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add Custom URL
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface p-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {editing ? "Edit Entry" : "New Custom URL"}
            </h3>
            <button type="button" onClick={handleCancel} className="text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">URL *</label>
            <input
              type="url"
              required
              placeholder={`${currentBaseUrl}/page`}
              value={form.url}
              onChange={(e) => { setForm((f) => ({ ...f, url: e.target.value })); setUrlError(""); }}
              onBlur={() => setUrlError(validateUrl(form.url))}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            {urlError && <p className="mt-1 text-xs text-red-500">{urlError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Change Frequency</label>
              <select
                value={form.changefreq}
                onChange={(e) => setForm((f) => ({ ...f, changefreq: e.target.value }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                {CHANGEFREQ_VALUES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Last Modified (optional)</label>
              <input
                type="date"
                value={form.last_modified}
                onChange={(e) => setForm((f) => ({ ...f, last_modified: e.target.value }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-brand"
                />
                Active
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : editing ? "Update" : "Add Entry"}
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">URL</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">Changefreq</th>
              <th className="px-4 py-3 text-left font-medium">Active</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              : (data?.entries ?? []).length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                      No custom entries yet.
                    </td>
                  </tr>
                )
                : (data?.entries ?? []).map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface/50">
                      <td className="px-4 py-3 font-mono text-xs text-foreground max-w-xs truncate" title={entry.url}>
                        {entry.url}
                      </td>
                      <td className="px-4 py-3 text-muted">{entry.priority}</td>
                      <td className="px-4 py-3 text-muted">{entry.changefreq}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${entry.is_active ? "text-green-600" : "text-muted"}`}>
                          {entry.is_active ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(entry)}
                            className="text-muted hover:text-foreground"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this entry?")) deleteMutation.mutate(entry.id);
                            }}
                            className="text-muted hover:text-red-500"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
