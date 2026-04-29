"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Select } from "@/app/admin/_components/ui/select";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";

interface PricePoint {
  id: string;
  price_cents: number;
  currency: string;
  recorded_at: string;
}

interface ProductOption {
  id: string;
  name: Record<string, string>;
  asin: string;
}

export function PriceHistoryChart({ products }: { products: ProductOption[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");

  const { data, isLoading } = useQuery<PricePoint[]>({
    queryKey: ["admin-price-history", productId],
    queryFn: async () => {
      if (!productId) return [];
      const res = await fetch(
        `/admin/api/analytics/price-history?product_id=${productId}`
      );
      if (!res.ok) throw new Error("Failed to fetch price history");
      return res.json();
    },
    enabled: !!productId,
  });

  const chartData = (data ?? []).map((p) => ({
    date: new Date(p.recorded_at).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    price: p.price_cents / 100,
    currency: p.currency,
  }));

  const currency = data?.[0]?.currency ?? "USD";

  return (
    <div className="space-y-4">
      <Select
        id="price-product"
        label="Product"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name?.en ?? p.asin} ({p.asin})
          </option>
        ))}
      </Select>

      {isLoading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : chartData.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          No price history for this product.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--color-muted)" }}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency,
                  maximumFractionDigits: 0,
                }).format(v)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value) => [
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency,
                }).format(Number(value)),
                "Price",
              ]}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="var(--color-brand)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
