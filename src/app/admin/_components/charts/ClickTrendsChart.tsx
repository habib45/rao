"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ClickTrendsChartProps {
  data: { day: string; click_count: number }[];
}

export function ClickTrendsChart({ data }: ClickTrendsChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No click data yet.</p>;
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--color-muted)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted)" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-background)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="click_count"
          name="Clicks"
          stroke="var(--color-brand)"
          fill="var(--color-brand)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
