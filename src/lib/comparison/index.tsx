"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const LS_KEY = "bf_comparison";
const MAX_EXTRA = 5; // current product is pinned; up to 5 more = 6 total

interface ComparisonContextValue {
  selectedIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  canAdd: boolean;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

function readFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
  } catch {
    // ignore corrupt data
  }
  return [];
}

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds(readFromStorage());
  }, []);

  const persist = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(ids));
    } catch {
      // ignore storage errors
    }
  }, []);

  const add = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id) || prev.length >= MAX_EXTRA) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds],
  );

  return (
    <ComparisonContext.Provider
      value={{
        selectedIds,
        add,
        remove,
        clear,
        isSelected,
        canAdd: selectedIds.length < MAX_EXTRA,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison(): ComparisonContextValue {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison must be used inside ComparisonProvider");
  return ctx;
}
