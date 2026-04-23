"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CategoryFormDialog } from "./CategoryFormDialog";
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

interface CategoryRow {
  id: string;
  name: Record<string, string>;
  slug: Record<string, string>;
  description: Record<string, string>;
  amazon_node_id: string | null;
  parent_id: string | null;
  sort_order: number;
  image_url: string | null;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

export function CategoriesTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);

  const { data: categories, isLoading } = useQuery<CategoryRow[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/admin/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const isEdit = !!body.id;
      const url = isEdit
        ? `/admin/api/categories/${body.id}`
        : "/admin/api/categories";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(editing ? "Category updated" : "Category created");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/admin/api/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to deactivate category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deactivated");
    },
    onError: () => toast.error("Failed to deactivate category"),
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(cat: CategoryRow) {
    setEditing(cat);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function parentName(parentId: string | null) {
    if (!parentId || !categories) return "—";
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name?.en ?? "—";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {categories?.length ?? 0} categories
        </p>
        <Button onClick={openCreate}>New Category</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">
                  {cat.name?.en ?? "Untitled"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {cat.slug?.en ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted">
                  {parentName(cat.parent_id)}
                </TableCell>
                <TableCell>{cat.product_count}</TableCell>
                <TableCell>{cat.sort_order}</TableCell>
                <TableCell>
                  <Badge variant={cat.is_active ? "success" : "error"}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(cat)}
                    >
                      Edit
                    </Button>
                    {cat.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(cat.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSave={(data) => saveMutation.mutate(editing ? { ...(data as unknown as Record<string, unknown>), id: editing.id } : (data as unknown as Record<string, unknown>))}
        saving={saveMutation.isPending}
        initial={editing}
        categories={categories ?? []}
      />
    </div>
  );
}
