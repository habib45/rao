"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import { Badge } from "@/app/admin/_components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/admin/_components/ui/table";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

interface ClickRow {
  id: string;
  product_id: string;
  locale: string;
  session_id: string;
  referrer: string | null;
  user_agent: string | null;
  clicked_at: string;
  products: { name: Record<string, string>; asin: string };
}

export function ClicksTable() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [locale, setLocale] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const pageSize = 50;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(from && { from }),
    ...(to && { to }),
    ...(locale && { locale }),
    ...(groupBy && { groupBy }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clicks", page, from, to, locale, groupBy],
    queryFn: async () => {
      const res = await fetch(`/admin/api/analytics/clicks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch clicks");
      return res.json();
    },
  });

  function exportCsv() {
    const exportParams = new URLSearchParams({
      ...(from && { from }),
      ...(to && { to }),
      ...(locale && { locale }),
    });
    window.open(`/admin/api/analytics/clicks/export?${exportParams}`, "_blank");
  }

  const isGrouped = !!groupBy;
  const totalPages = isGrouped ? 1 : Math.ceil((data?.total ?? 0) / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          id="from"
          label="From"
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
        />
        <Input
          id="to"
          label="To"
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
        />
        <Select
          id="locale-filter"
          label="Locale"
          value={locale}
          onChange={(e) => { setLocale(e.target.value); setPage(1); }}
        >
          <option value="">All</option>
          <option value="en">English</option>
          <option value="bn-BD">Bangla</option>
          <option value="sv">Swedish</option>
        </Select>
        <Select
          id="group-by"
          label="Group By"
          value={groupBy}
          onChange={(e) => { setGroupBy(e.target.value); setPage(1); }}
        >
          <option value="">None</option>
          <option value="day">Day</option>
          <option value="locale">Locale</option>
          <option value="product">Product</option>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isGrouped ? (
        <GroupedTable data={data?.grouped ?? []} groupBy={groupBy} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>ASIN</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead>Referrer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.clicks as ClickRow[])?.map((click) => (
                <TableRow key={click.id}>
                  <TableCell className="text-xs">
                    {new Date(click.clicked_at).toLocaleString("en", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {click.products?.name?.en ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {click.products?.asin ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{click.locale}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted">
                    {click.referrer ?? "direct"}
                  </TableCell>
                </TableRow>
              ))}
              {data?.clicks?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted">
                    No clicks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                Page {page} of {totalPages} ({data?.total ?? 0} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GroupedTable({ data, groupBy }: { data: Record<string, unknown>[]; groupBy: string }) {
  if (groupBy === "day") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Clicks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{String(row.day)}</TableCell>
              <TableCell>{Number(row.clicks)}</TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="py-8 text-center text-muted">No data.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  if (groupBy === "locale") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Locale</TableHead>
            <TableHead>Clicks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              <TableCell>
                <Badge variant="info">{String(row.locale)}</Badge>
              </TableCell>
              <TableCell>{Number(row.clicks)}</TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="py-8 text-center text-muted">No data.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  if (groupBy === "product") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>ASIN</TableHead>
            <TableHead>Clicks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{String(row.name)}</TableCell>
              <TableCell className="font-mono text-xs">{String(row.asin)}</TableCell>
              <TableCell>{Number(row.clicks)}</TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted">No data.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  return null;
}
