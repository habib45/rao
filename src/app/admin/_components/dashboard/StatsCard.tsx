import type { LucideIcon } from "lucide-react";
import { Card } from "@/app/admin/_components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted">{description}</p>
          )}
        </div>
        <div className="rounded-lg bg-brand/10 p-2">
          <Icon className="h-5 w-5 text-brand" />
        </div>
      </div>
    </Card>
  );
}
