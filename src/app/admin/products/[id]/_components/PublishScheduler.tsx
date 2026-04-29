"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Rocket, X } from "lucide-react";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";

interface PublishSchedulerProps {
  productId: string;
  currentPublishAt: string | null;
}

// Convert an ISO UTC string to the value expected by <input type="datetime-local">,
// which is the user's local time formatted as YYYY-MM-DDTHH:mm.
function isoToLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelative(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return "";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(ms);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(ms / minute), "minute");
  if (abs < day) return rtf.format(Math.round(ms / hour), "hour");
  return rtf.format(Math.round(ms / day), "day");
}

export function PublishScheduler({
  productId,
  currentPublishAt,
}: PublishSchedulerProps) {
  const router = useRouter();
  const [value, setValue] = useState<string>(isoToLocalInputValue(currentPublishAt));
  const [pending, setPending] = useState<"schedule" | "publish" | "clear" | null>(null);

  const isFutureDate = (() => {
    if (!value) return false;
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) && ms > Date.now();
  })();

  async function patch(body: Record<string, unknown>, kind: "schedule" | "publish" | "clear") {
    setPending(kind);
    try {
      const res = await fetch(`/admin/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          typeof data?.error === "string" ? data.error : `Request failed (${res.status})`,
        );
      }
      if (kind === "schedule") toast.success("Scheduled for publishing");
      if (kind === "publish") toast.success("Product published");
      if (kind === "clear") toast.success("Schedule cleared");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(null);
    }
  }

  function handleSchedule() {
    if (!isFutureDate) return;
    // datetime-local values are treated as local time — serialise through Date to get UTC ISO.
    const iso = new Date(value).toISOString();
    patch({ publish_at: iso }, "schedule");
  }

  function handlePublishNow() {
    patch({ is_active: true, publish_at: null }, "publish");
  }

  function handleClear() {
    setValue("");
    patch({ publish_at: null }, "clear");
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <CalendarClock className="h-4 w-4 text-brand" />
        Schedule Publishing
      </div>

      {currentPublishAt && (
        <p className="mb-3 text-sm text-muted">
          Currently scheduled for{" "}
          <span className="font-medium text-foreground">{formatAbsolute(currentPublishAt)}</span>{" "}
          ({formatRelative(currentPublishAt)}).
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <Input
            id="publish-at"
            label="Publish at"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={pending !== null}
          />
        </div>
        <Button
          onClick={handleSchedule}
          disabled={!isFutureDate || pending !== null}
        >
          {pending === "schedule" ? "Scheduling…" : "Schedule"}
        </Button>
        <Button
          variant="secondary"
          onClick={handlePublishNow}
          disabled={pending !== null}
        >
          <Rocket className="h-4 w-4" />
          {pending === "publish" ? "Publishing…" : "Publish Now"}
        </Button>
        {currentPublishAt && (
          <Button
            variant="ghost"
            onClick={handleClear}
            disabled={pending !== null}
          >
            <X className="h-4 w-4" />
            {pending === "clear" ? "Clearing…" : "Clear schedule"}
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        An hourly job flips <span className="font-medium">is_active</span> to true when the scheduled time arrives.
      </p>
    </div>
  );
}
