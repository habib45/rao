"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Badge } from "@/app/admin/_components/ui/badge";
import type { ProductStatus } from "@/types/domain";

interface WorkflowActionsProps {
  productId: string;
  status: ProductStatus;
  rejectionReason: string | null;
}

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  published: "Published",
};

const STATUS_VARIANT: Record<
  ProductStatus,
  "default" | "warning" | "success" | "info"
> = {
  draft: "default",
  pending_review: "warning",
  approved: "success",
  published: "info",
};

export function WorkflowActions({
  productId,
  status,
  rejectionReason,
}: WorkflowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"submit" | "publish" | null>(null);

  async function handleSubmitForReview() {
    setPending("submit");
    try {
      const res = await fetch(`/admin/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_status: "pending_review" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          typeof data?.error === "string" ? data.error : "Submit failed"
        );
      }
      toast.success("Submitted for review");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setPending(null);
    }
  }

  async function handlePublishNow() {
    setPending("publish");
    try {
      const res = await fetch(
        `/admin/api/products/${productId}/publish`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          typeof data?.error === "string" ? data.error : "Publish failed"
        );
      }
      toast.success("Product published");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Workflow Status</h3>
        <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
      </div>

      {rejectionReason && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <strong className="font-medium">Rejection reason:</strong>{" "}
          {rejectionReason}
        </div>
      )}

      {status === "draft" && (
        <Button
          onClick={handleSubmitForReview}
          disabled={pending !== null}
        >
          {pending === "submit" ? "Submitting..." : "Submit for Review"}
        </Button>
      )}

      {status === "approved" && (
        <Button
          onClick={handlePublishNow}
          disabled={pending !== null}
        >
          {pending === "publish" ? "Publishing..." : "Publish Now"}
        </Button>
      )}

      {(status === "pending_review" || status === "published") && (
        <p className="text-sm text-muted">
          {status === "pending_review"
            ? "Awaiting review by an editor."
            : "Product is live."}
        </p>
      )}
    </div>
  );
}
