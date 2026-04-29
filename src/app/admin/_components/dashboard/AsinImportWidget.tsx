"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Package, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/admin/_components/ui/card";
import { Input } from "@/app/admin/_components/ui/input";
import { Button } from "@/app/admin/_components/ui/button";

type ImportSuccess = {
  product_id: string;
  asin: string;
  name: Record<string, string>;
};

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: ImportSuccess }
  | { kind: "error"; message: string };

const ASIN_PATTERN = /^[A-Z0-9]{10}$/;

export function AsinImportWidget() {
  const [asin, setAsin] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isValid = ASIN_PATTERN.test(asin);
  const isLoading = status.kind === "loading";

  async function handleSubmit() {
    if (!isValid || isLoading) return;
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/admin/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asin }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string" ? body.error : `Import failed (${res.status})`,
        );
      }
      setStatus({ kind: "success", data: body as ImportSuccess });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Import failed",
      });
    }
  }

  function reset() {
    setAsin("");
    setStatus({ kind: "idle" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Product by ASIN</CardTitle>
      </CardHeader>
      <CardContent>
        {status.kind === "success" ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                Imported {status.data.name?.en ?? status.data.asin}
              </p>
              <p className="text-xs text-muted">ASIN: {status.data.asin}</p>
              <div className="mt-2 flex gap-2">
                <Link
                  href={`/admin/products/${status.data.product_id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  <Package className="h-3.5 w-3.5" /> Open draft
                </Link>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Import another
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  id="asin-import"
                  label="ASIN"
                  placeholder="B0ABCDE123"
                  value={asin}
                  maxLength={10}
                  onChange={(e) => setAsin(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  aria-invalid={asin.length > 0 && !isValid}
                />
              </div>
              <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing…
                  </>
                ) : (
                  "Sync"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted">
              Creates a draft product (<span className="font-medium">is_active: false</span>) with live Amazon data. Review and publish from the edit page.
            </p>
            {status.kind === "error" && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-foreground">{status.message}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
