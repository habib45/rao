"use client";

import { useState } from "react";
import { Globe, Zap, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

type SitemapConfig = {
  baseUrl: string;
  lastGenerated: string | null;
  isAutoDetected: boolean;
};

type Props = {
  config: SitemapConfig | null;
  onConfigChange: () => void;
  loading: boolean;
};

export function SitemapUrlManager({ config, onConfigChange, loading }: Props) {
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [settingUrl, setSettingUrl] = useState(false);

  async function handleAutoGenerate() {
    setAutoGenerating(true);
    try {
      const res = await fetch("/admin/api/sitemap?action=auto-generate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to auto-generate");
      toast.success("Sitemap URL auto-generated from environment");
      onConfigChange();
    } catch {
      toast.error("Failed to auto-generate sitemap URL");
    } finally {
      setAutoGenerating(false);
    }
  }

  async function handleClean() {
    if (!confirm("Are you sure you want to clean the sitemap configuration? This will reset to default settings.")) {
      return;
    }
    
    setCleaning(true);
    try {
      const res = await fetch("/admin/api/sitemap?action=clean", { method: "POST" });
      if (!res.ok) throw new Error("Failed to clean");
      toast.success("Sitemap configuration cleaned successfully");
      onConfigChange();
    } catch {
      toast.error("Failed to clean sitemap configuration");
    } finally {
      setCleaning(false);
    }
  }

  async function handleSetCustomUrl() {
    if (!customUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    setSettingUrl(true);
    try {
      const res = await fetch("/admin/api/sitemap?action=set-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: customUrl.trim() }),
      });
      if (!res.ok) throw new Error("Failed to set URL");
      toast.success("Sitemap base URL updated successfully");
      setShowUrlDialog(false);
      setCustomUrl("");
      onConfigChange();
    } catch {
      toast.error("Failed to set custom URL");
    } finally {
      setSettingUrl(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-9 w-32" />;
  }

  const isProductionUrl = config?.baseUrl?.startsWith("https://") && 
                          !config?.baseUrl?.includes("localhost") && 
                          !config?.baseUrl?.includes("127.0.0.1");

  return (
    <div className="flex items-center gap-2">
      {/* Current URL Display */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {config?.baseUrl || "Not configured"}
        </span>
        {isProductionUrl ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        )}
      </div>

      {/* Auto Generate Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAutoGenerate}
        disabled={autoGenerating}
        title="Auto-detect from environment"
      >
        <Zap className={`h-4 w-4 ${autoGenerating ? "animate-pulse" : ""}`} />
        {autoGenerating ? "Detecting…" : "Auto Generate"}
      </Button>

      {/* Clean Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleClean}
        disabled={cleaning}
        title="Reset to default"
      >
        <Trash2 className={`h-4 w-4 ${cleaning ? "animate-pulse" : ""}`} />
        {cleaning ? "Cleaning…" : "Clean"}
      </Button>

      {/* Custom URL Dialog (simplified as inline for now) */}
      {showUrlDialog && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="https://yourdomain.com"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm w-64"
            onKeyDown={(e) => e.key === "Enter" && handleSetCustomUrl()}
          />
          <Button size="sm" onClick={handleSetCustomUrl} disabled={settingUrl}>
            {settingUrl ? "Setting…" : "Set"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowUrlDialog(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}