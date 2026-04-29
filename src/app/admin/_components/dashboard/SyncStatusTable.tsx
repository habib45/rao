import { Badge } from "@/app/admin/_components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/admin/_components/ui/table";

interface SyncLog {
  id: string;
  function_name: string;
  status: string;
  items_processed: number;
  errors: unknown[];
  started_at: string;
  completed_at: string | null;
}

export function SyncStatusTable({ logs }: { logs: SyncLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted">No sync logs yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Function</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Errors</TableHead>
          <TableHead>Started</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-medium">{log.function_name}</TableCell>
            <TableCell>
              <Badge
                variant={
                  log.status === "success"
                    ? "success"
                    : log.status === "partial"
                      ? "warning"
                      : "error"
                }
              >
                {log.status}
              </Badge>
            </TableCell>
            <TableCell>{log.items_processed}</TableCell>
            <TableCell>{Array.isArray(log.errors) ? log.errors.length : 0}</TableCell>
            <TableCell className="text-muted">
              {new Date(log.started_at).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
