import type { HTMLAttributes } from "react";
import { cn } from "@/app/admin/_lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-border/50", className)}
      {...props}
    />
  );
}
