"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/app/admin/_components/ui/skeleton";
import { Button } from "@/app/admin/_components/ui/button";

interface BlogPostRef {
  title: Record<string, string> | string;
}

interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  body: string;
  is_approved: boolean;
  created_at: string;
  blog_post_id: string;
  blog_posts: BlogPostRef | null;
}

interface ApiResponse {
  data: Comment[];
  total: number;
}

type StatusFilter = "all" | "pending" | "approved";

const PER_PAGE_OPTIONS = [20, 50, 100] as const;

function postTitle(ref: BlogPostRef | null): string {
  if (!ref) return "—";
  if (typeof ref.title === "string") return ref.title;
  return ref.title.en ?? Object.values(ref.title)[0] ?? "—";
}

export function CommentsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<(typeof PER_PAGE_OPTIONS)[number]>(20);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 350);
  }

  const queryKey = ["admin-comments", page, perPage, status, debouncedSearch];

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        status,
      });
      if (debouncedSearch) params.set("postId", debouncedSearch);
      const res = await fetch(`/admin/api/blog/comments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json() as Promise<ApiResponse>;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const res = await fetch(`/admin/api/blog/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved }),
      });
      if (!res.ok) throw new Error("Failed to update comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Comment updated");
    },
    onError: () => toast.error("Failed to update comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/admin/api/blog/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / perPage));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by post ID…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 dark:bg-surface"
        />

        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {(["all", "pending", "approved"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                status === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-muted">
          <span>{data?.total ?? 0} comments</span>
          <select
            value={String(perPage)}
            onChange={(e) => {
              setPerPage(Number(e.target.value) as (typeof PER_PAGE_OPTIONS)[number]);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 dark:bg-surface"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">Author</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Comment</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Post</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No comments found.
                  </td>
                </tr>
              ) : (
                data?.data?.map((comment) => (
                  <tr
                    key={comment.id}
                    className="bg-white hover:bg-surface/50 dark:bg-transparent"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{comment.author_name}</p>
                      <p className="text-xs text-muted">{comment.author_email}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="line-clamp-2 text-muted">{comment.body}</p>
                    </td>
                    <td className="max-w-45 px-4 py-3 text-muted">
                      <p className="truncate">{postTitle(comment.blog_posts)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          comment.is_approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {comment.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(comment.created_at).toLocaleDateString("en", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={comment.is_approved ? "secondary" : "primary"}
                          disabled={
                            approveMutation.isPending || deleteMutation.isPending
                          }
                          onClick={() =>
                            approveMutation.mutate({
                              id: comment.id,
                              is_approved: !comment.is_approved,
                            })
                          }
                        >
                          {comment.is_approved ? "Hide" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={
                            approveMutation.isPending || deleteMutation.isPending
                          }
                          onClick={() => {
                            if (confirm("Delete this comment permanently?")) {
                              deleteMutation.mutate(comment.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
