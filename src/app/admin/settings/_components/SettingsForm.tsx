"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/app/admin/_components/ui/input";
import { Button } from "@/app/admin/_components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/admin/_components/ui/card";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";
import { Toggle } from "@/app/admin/_components/ui/toggle";
import { ComparisonKeysEditor } from "./ComparisonKeysEditor";

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
  show_price?: boolean;
}

const TRUE_LITERALS = new Set(["true", "1", "yes", "on"]);
const FALSE_LITERALS = new Set(["false", "0", "no", "off"]);

const coerceBoolean = (value: unknown, defaultValue: boolean): boolean => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (TRUE_LITERALS.has(normalized)) return true;
    if (FALSE_LITERALS.has(normalized)) return false;
    return defaultValue;
  }
  return defaultValue;
};

const coerceFeatureFlags = (raw: unknown): FeatureFlags => {
  if (!raw) {
    return { show_price: true };
  }

  let input: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      input = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      input = null;
    }
  } else if (typeof raw === "object") {
    input = raw as Record<string, unknown>;
  }

  if (!input) {
    return { show_price: true };
  }

  return {
    cart_enabled: coerceBoolean(input.cart_enabled, false),
    reviews_enabled: coerceBoolean(input.reviews_enabled, false),
    price_alerts_enabled: coerceBoolean(input.price_alerts_enabled, false),
    show_price: coerceBoolean(input.show_price, true),
  };
};

const serializeFeatureFlags = (flags: FeatureFlags): Record<string, boolean> => ({
  cart_enabled: coerceBoolean(flags.cart_enabled, false),
  reviews_enabled: coerceBoolean(flags.reviews_enabled, false),
  price_alerts_enabled: coerceBoolean(flags.price_alerts_enabled, false),
  show_price: coerceBoolean(flags.show_price, true),
});

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
  const [comparisonKeys, setComparisonKeys] = useState<string[]>([]);

  useEffect(() => {
    if (settings) {
      setAffiliate((settings.affiliate as AffiliateSettings) ?? {});
      setFeatures(coerceFeatureFlags(settings.features));
      const comp = settings.comparison as { keys?: string[] } | undefined;
      setComparisonKeys(comp?.keys ?? []);
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

  const saveFeatures = () => {
    const normalized = serializeFeatureFlags(features);
    saveMutation.mutate({ features: normalized });
  };

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
            Sync settings are managed via the MySQL API gateway configuration.
          </p>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Show Product Prices</p>
                <p className="text-xs text-muted mt-0.5">
                  When off, prices are hidden across the entire storefront for all categories.
                </p>
              </div>
              <Toggle
                id="show_price"
                checked={features.show_price ?? true}
                onChange={(val) => setFeatures((p) => ({ ...p, show_price: val }))}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={saveFeatures}
              disabled={saveMutation.isPending}
            >
              Save Display Settings
            </Button>
          </div>
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
              onClick={saveFeatures}
              disabled={saveMutation.isPending}
            >
              Save Feature Flags
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Product Comparison Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted">
            Attribute rows shown in the comparison table. Values come from each product&apos;s attributes field.
          </p>
          <ComparisonKeysEditor
            keys={comparisonKeys}
            onChange={setComparisonKeys}
          />
          <div className="mt-4">
            <Button
              onClick={() =>
                saveMutation.mutate({ comparison: { keys: comparisonKeys } })
              }
              disabled={saveMutation.isPending}
            >
              Save Comparison Keys
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
