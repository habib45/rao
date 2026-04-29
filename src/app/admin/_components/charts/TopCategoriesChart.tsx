"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface TopCategoriesChartProps {
  data: { name: string; click_count: number }[];
}

export function TopCategoriesChart({ data }: TopCategoriesChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No category data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-muted)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted)" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-background)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="click_count" name="Clicks" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
