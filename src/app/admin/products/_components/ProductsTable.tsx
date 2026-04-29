"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ProductFilters } from "./ProductFilters";
import { Badge } from "@/app/admin/_components/ui/badge";
import { Button } from "@/app/admin/_components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/app/admin/_components/ui/table";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";
import type { Product } from "@/types/domain";

interface Category {
  id: string;
  name: Record<string, string>;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export function ProductsTable({ categories }: { categories: Category[] }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", category: "", status: "all" });
  const pageSize = 20;

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["admin-products", page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status !== "all" && { status: filters.status }),
      });
      const res = await fetch(`/admin/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/admin/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      });
      if (!res.ok) throw new Error("Failed to update product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product updated");
    },
    onError: () => toast.error("Failed to update product"),
  });

  const handleFilterChange = useCallback(
    (newFilters: { search: string; category: string; status: string }) => {
      setFilters(newFilters);
      setPage(1);
    },
    []
  );

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  function formatPrice(cents: number | null, currency: string) {
    if (cents === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  }

  return (
    <div className="space-y-4">
      <ProductFilters categories={categories} onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>ASIN</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.products.map((product) => {
              const primaryImage = product.product_images?.find((img) => img.is_primary);
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-surface" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {product.name?.en ?? "Untitled"}
                    </Link>
                    {product.brand && (
                      <p className="text-xs text-muted">{product.brand}</p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{product.asin}</TableCell>
                  <TableCell>{formatPrice(product.price_cents, product.currency)}</TableCell>
                  <TableCell>
                    {product.rating !== null ? (
                      <span className="text-sm">
                        {product.rating.toFixed(1)} <span className="text-muted">({product.review_count})</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() =>
                        toggleActive.mutate({
                          id: product.id,
                          is_active: !product.is_active,
                        })
                      }
                      disabled={toggleActive.isPending}
                    >
                      <Badge variant={product.is_active ? "success" : "error"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {new Date(product.updated_at).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {data?.products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data?.total ?? 0)} of{" "}
            {data?.total ?? 0}
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
    </div>
  );
}
