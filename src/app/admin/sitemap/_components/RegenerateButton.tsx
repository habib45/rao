"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function RegenerateButton() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleRegenerate() {
    setLoading(true);
    try {
      const res = await fetch("/admin/api/sitemap/revalidate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to revalidate");
      toast.success("Sitemap cache cleared. Changes appear on the next visit.");
      // Invalidate queries to refresh the data
      qc.invalidateQueries({ queryKey: ["sitemap-preview"] });
      qc.invalidateQueries({ queryKey: ["sitemap-exclusions"] });
    } catch {
      toast.error("Failed to regenerate sitemap.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegenerate}
      disabled={loading}
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Regenerating…" : "Force Regenerate"}
    </Button>
  );
}
