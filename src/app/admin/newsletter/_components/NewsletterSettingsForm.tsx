"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/app/admin/_components/ui/input";
import { Button } from "@/app/admin/_components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/admin/_components/ui/card";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";
import { Toggle } from "@/app/admin/_components/ui/toggle";

interface NewsletterSettings {
  show: boolean;
  title: string;
  subtitle: string;
  background: "indigo" | "gray" | "dark";
}

const BACKGROUND_OPTIONS: { value: NewsletterSettings["background"]; label: string }[] = [
  { value: "indigo", label: "Indigo (vibrant)" },
  { value: "gray", label: "Gray (neutral)" },
  { value: "dark", label: "Dark" },
];

const DEFAULT_SETTINGS: NewsletterSettings = {
  show: true,
  title: "Stay in the loop",
  subtitle: "Get the latest deals and articles delivered to your inbox.",
  background: "indigo",
};

export function NewsletterSettingsForm() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NewsletterSettings>({
    queryKey: ["newsletter-settings-admin"],
    queryFn: async () => {
      const res = await fetch("/admin/api/newsletter/settings");
      if (!res.ok) throw new Error("Failed to fetch newsletter settings");
      const json = (await res.json()) as Partial<NewsletterSettings>;
      return { ...DEFAULT_SETTINGS, ...json };
    },
  });

  const [form, setForm] = useState<NewsletterSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (body: NewsletterSettings) => {
      const res = await fetch("/admin/api/newsletter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Save failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-settings-admin"] });
      toast.success("Newsletter settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Show newsletter section</p>
              <p className="mt-0.5 text-xs text-muted">
                When off, the subscription form is hidden on the blog page.
              </p>
            </div>
            <Toggle
              id="newsletter-show"
              checked={form.show}
              onChange={(val) => setForm((p) => ({ ...p, show: val }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="newsletter-title"
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <div className="space-y-1">
            <label htmlFor="newsletter-subtitle" className="text-sm font-medium">
              Subtitle
            </label>
            <textarea
              id="newsletter-subtitle"
              rows={3}
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 dark:bg-surface"
            />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Background</p>
            <div className="flex flex-wrap gap-3">
              {BACKGROUND_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="newsletter-bg"
                    value={value}
                    checked={form.background === value}
                    onChange={() => setForm((p) => ({ ...p, background: value }))}
                    className="accent-brand"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
