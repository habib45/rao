"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";

interface ReviewActionsProps {
  productId: string;
}

export function ReviewActions({ productId }: ReviewActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function handleApprove() {
    setPending("approve");
    try {
      const res = await fetch(`/admin/api/products/${productId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          typeof data?.error === "string" ? data.error : "Approve failed"
        );
      }
      toast.success("Product approved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setPending(null);
    }
  }

  async function handleConfirmReject() {
    setPending("reject");
    try {
      const res = await fetch(`/admin/api/products/${productId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          typeof data?.error === "string" ? data.error : "Reject failed"
        );
      }
      toast.success("Product rejected");
      setRejecting(false);
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setPending(null);
    }
  }

  if (rejecting) {
    return (
      <div className="flex flex-col items-end gap-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Reason for rejection (optional)"
          className="w-64 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand"
          aria-label="Rejection reason"
        />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRejecting(false);
              setReason("");
            }}
            disabled={pending !== null}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirmReject}
            disabled={pending !== null}
          >
            {pending === "reject" ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={pending !== null}
      >
        {pending === "approve" ? "Approving..." : "Approve"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setRejecting(true)}
        disabled={pending !== null}
      >
        Reject
      </Button>
    </div>
  );
}
