"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Star, Flame } from "lucide-react";
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
import { Dialog } from "@/app/admin/_components/ui/dialog";
import type { BlogPost, BlogPostStatus } from "@/types/domain";

interface BlogPostsResponse {
  posts: BlogPost[];
}

function statusVariant(
  status: BlogPostStatus,
): "default" | "success" | "warning" | "error" {
  switch (status) {
    case "published":
      return "success";
    case "archived":
      return "error";
    default:
      return "default";
  }
}

export function BlogPostsTable() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<BlogPostsResponse>({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const res = await fetch("/admin/api/blog");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<{
        is_featured: boolean;
        status: BlogPostStatus;
      }>;
    }) => {
      const res = await fetch(`/admin/api/blog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post updated");
    },
    onError: () => toast.error("Failed to update post"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/admin/api/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post deleted");
      setDeletingId(null);
    },
    onError: () => toast.error("Failed to delete post"),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const posts = data?.posts ?? [];

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => {
            const titleEn = post.title?.en ?? "Untitled";
            const categoryName = post.blog_categories
              ? post.blog_categories.name?.en ?? "—"
              : "—";
            const publishedDate = post.published_at
              ? new Date(post.published_at).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";

            return (
              <TableRow key={post.id}>
                <TableCell>
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="font-medium hover:text-brand"
                  >
                    {titleEn}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted">
                  {categoryName}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(post.status)}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{post.author_name}</TableCell>
                <TableCell className="text-xs text-muted">
                  {publishedDate}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() =>
                      updateMutation.mutate({
                        id: post.id,
                        payload: { is_featured: !post.is_featured },
                      })
                    }
                    disabled={updateMutation.isPending}
                    aria-label={
                      post.is_featured ? "Unfeature post" : "Feature post"
                    }
                    title={post.is_featured ? "Featured" : "Not featured"}
                    className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-brand"
                  >
                    {post.is_featured ? (
                      <Star className="h-4 w-4 fill-current text-brand" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </button>
                  {post.view_count > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted">
                      <Flame className="h-3 w-3" />
                      {post.view_count}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`/admin/blog/${post.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeletingId(post.id)}
                      className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {posts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted">
                No blog posts yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Delete blog post"
      >
        <p className="text-sm text-foreground">
          Are you sure you want to permanently delete this post? This cannot be
          undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeletingId(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}
