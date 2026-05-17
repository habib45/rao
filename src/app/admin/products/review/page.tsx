import Link from "next/link";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/admin/_components/ui/table";
import { Badge } from "@/app/admin/_components/ui/badge";
import { ReviewActions } from "./_components/ReviewActions";
import type { Product } from "@/types/domain";

export default async function ReviewQueuePage() {
  const user = await requireAdmin();
  // Note: Review queue functionality requires admin-specific query
  // For now, return empty array until gateway supports product_status filtering
  const products: Product[] = [];

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Review Queue</h1>
          <p className="text-sm text-muted">
            Products submitted for review. Approve to allow publishing or
            reject with a reason to send them back to draft.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted">
            No products awaiting review.
          </div>
        ) : (
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>ASIN</TableHead>
                  <TableHead>Submitted by</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium text-foreground hover:text-brand"
                      >
                        {p.name?.en ?? "(no name)"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{p.asin || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted">
                      {p.submitted_by ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted">
                      {new Date(p.created_at).toLocaleString("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <ReviewActions productId={p.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}
      </div>
    </AdminShell>
  );
}
