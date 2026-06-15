"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Star, Flame, ChevronDown, Copy } from "lucide-react";
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
import { SEOAnalysis } from "./SEOAnalysis";
import { SEOScoreDisplay } from "./SEOScoreDisplay";
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
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery<BlogPostsResponse>({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const res = await fetch("/admin/api/blog");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
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
        overall_seo_score: number;
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

  const toggleRowExpansion = (postId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedRows(newExpanded);
  };

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

  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/admin/api/blog/${id}/clone`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to clone post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post cloned successfully as draft");
      setCloningId(null);
    },
    onError: () => toast.error("Failed to clone post"),
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="font-semibold text-red-700">Error loading blog posts</p>
        <p className="mt-1 text-sm text-red-600">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <p className="mt-2 text-xs text-red-500">
          Check that the API gateway is running at the configured MYSQL_API_URL
        </p>
      </div>
    );
  }

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
      <div className="w-full overflow-x-auto -mx-6 px-6">
        <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Image</TableHead>
            <TableHead className="min-w-48">Title</TableHead>
            <TableHead className="w-32">Category</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-32">Author</TableHead>
            <TableHead className="w-28">Published</TableHead>
            <TableHead className="w-20">Featured</TableHead>
            <TableHead className="w-24">Views</TableHead>
            <TableHead className="w-28">SEO Score</TableHead>
            <TableHead className="w-32">Actions</TableHead>
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
                  <div className="relative h-12 w-20 overflow-hidden rounded bg-surface">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={titleEn}
                        fill
                        className="object-cover"
                        sizes="80px"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="flex h-full w-full items-center justify-center text-xl text-muted">📝</div>';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl text-muted">
                        📝
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRowExpansion(post.id)}
                      className="rounded p-1 hover:bg-surface transition-colors"
                      aria-label="Toggle SEO analysis"
                    >
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${
                          expandedRows.has(post.id) ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {titleEn}
                    </Link>
                  </div>
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
                  <div className="flex items-center gap-2">
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
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Flame className="h-3 w-3" />
                        {post.view_count}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-muted" />
                    {post.view_count || 0}
                  </div>
                </TableCell>
                <TableCell>
                  <SEOScoreDisplay post={post} onUpdate={updateMutation} />
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
                      onClick={() => setCloningId(post.id)}
                      className="rounded-lg p-2 text-muted hover:bg-surface hover:text-brand"
                      aria-label="Clone post"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
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
          {posts.map((post) => 
            expandedRows.has(post.id) ? (
              <TableRow key={`seo-${post.id}`}>
                <TableCell colSpan={10} className="p-4 bg-surface/30">
                  <SEOAnalysis post={post} />
                </TableCell>
              </TableRow>
            ) : null
          )}
          {posts.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="py-8 text-center text-muted">
                No blog posts yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

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

      <Dialog
        open={cloningId !== null}
        onClose={() => setCloningId(null)}
        title="Clone blog post"
      >
        <p className="text-sm text-foreground">
          Are you sure you want to create a copy of this post? The cloned post
          will be created as a draft.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCloningId(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => cloningId && cloneMutation.mutate(cloningId)}
            disabled={cloneMutation.isPending}
          >
            Clone
          </Button>
        </div>
      </Dialog>
    </>
  );
}
