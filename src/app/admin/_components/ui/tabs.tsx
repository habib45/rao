"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/app/admin/_lib/cn";

const TabsContext = createContext<{
  active: string;
  setActive: (value: string) => void;
}>({ active: "", setActive: () => {} });

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex gap-1 rounded-lg border border-border bg-surface p-1",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button
      role="tab"
      aria-selected={active === value}
      onClick={() => setActive(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active === value
          ? "bg-background text-foreground shadow-sm"
          : "text-muted hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
