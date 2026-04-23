"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";

export function ForceSyncButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch(`/admin/api/products/${productId}/sync`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Sync failed");
      }
      toast.success("Product synced from Amazon");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleSync} disabled={loading}>
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Syncing..." : "Force Sync"}
    </Button>
  );
}
