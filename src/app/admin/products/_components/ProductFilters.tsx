"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";

interface Category {
  id: string;
  name: Record<string, string>;
}

interface ProductFiltersProps {
  categories: Category[];
  onFilterChange: (filters: {
    search: string;
    category: string;
    status: string;
  }) => void;
}

export function ProductFilters({ categories, onFilterChange }: ProductFiltersProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("all");

  const emitChange = useCallback(() => {
    onFilterChange({ search, category, status });
  }, [search, category, status, onFilterChange]);

  useEffect(() => {
    const timer = setTimeout(emitChange, 300);
    return () => clearTimeout(timer);
  }, [emitChange]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="w-48">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name?.en ?? c.id}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-36">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
    </div>
  );
}
