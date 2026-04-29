"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/app/admin/_components/ui/input";
import { Button } from "@/app/admin/_components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/admin/_components/ui/card";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

interface AffiliateSettings {
  tag_en?: string;
  tag_bn?: string;
  tag_sv?: string;
}

interface SyncSettings {
  interval_hours?: number;
  batch_size?: number;
  last_run?: string;
}

interface FeatureFlags {
  cart_enabled?: boolean;
  reviews_enabled?: boolean;
  price_alerts_enabled?: boolean;
}

export function SettingsForm() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Record<string, unknown>>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/admin/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const [affiliate, setAffiliate] = useState<AffiliateSettings>({});
  const [features, setFeatures] = useState<FeatureFlags>({});

  useEffect(() => {
    if (settings) {
      setAffiliate((settings.affiliate as AffiliateSettings) ?? {});
      setFeatures((settings.features as FeatureFlags) ?? {});
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/admin/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const sync = (settings?.sync as SyncSettings) ?? {};

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Affiliate Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="tag-en"
              label="English Tag"
              value={affiliate.tag_en ?? ""}
              onChange={(e) => setAffiliate((p) => ({ ...p, tag_en: e.target.value }))}
            />
            <Input
              id="tag-bn"
              label="Bangla Tag"
              value={affiliate.tag_bn ?? ""}
              onChange={(e) => setAffiliate((p) => ({ ...p, tag_bn: e.target.value }))}
            />
            <Input
              id="tag-sv"
              label="Swedish Tag"
              value={affiliate.tag_sv ?? ""}
              onChange={(e) => setAffiliate((p) => ({ ...p, tag_sv: e.target.value }))}
            />
          </div>
          <div className="mt-4">
            <Button
              onClick={() => saveMutation.mutate({ affiliate })}
              disabled={saveMutation.isPending}
            >
              Save Affiliate Tags
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Configuration (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted">Interval</p>
              <p className="text-sm">{sync.interval_hours ?? "—"} hours</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Batch Size</p>
              <p className="text-sm">{sync.batch_size ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Last Run</p>
              <p className="text-sm">
                {sync.last_run
                  ? new Date(sync.last_run).toLocaleString("en")
                  : "Never"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Sync settings are managed via Supabase Edge Functions configuration.
          </p>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {([
              ["cart_enabled", "Shopping Cart"],
              ["reviews_enabled", "Product Reviews"],
              ["price_alerts_enabled", "Price Alerts"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={features[key] ?? false}
                  onChange={(e) =>
                    setFeatures((p) => ({ ...p, [key]: e.target.checked }))
                  }
                  className="rounded border-border"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Button
              onClick={() => saveMutation.mutate({ features })}
              disabled={saveMutation.isPending}
            >
              Save Feature Flags
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
