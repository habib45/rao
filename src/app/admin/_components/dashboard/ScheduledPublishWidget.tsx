import Link from "next/link";
import { CalendarClock } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/admin/_components/ui/table";
import type { ScheduledProduct } from "@/app/admin/_lib/queries/dashboard";

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRelative(iso: string, now: number = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
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

interface ScheduledPublishWidgetProps {
  products: ScheduledProduct[];
}

export function ScheduledPublishWidget({ products }: ScheduledPublishWidgetProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <CalendarClock className="h-4 w-4" />
        No products currently scheduled.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Scheduled</TableHead>
          <TableHead className="w-20 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">
              {p.name?.en ?? p.asin}
              <span className="ml-2 text-xs text-muted">{p.asin}</span>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{formatAbsolute(p.publish_at)}</span>
                <span className="text-xs text-muted">{formatRelative(p.publish_at)}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/admin/products/${p.id}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                Edit
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
