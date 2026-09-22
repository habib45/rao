import { Skeleton } from "@/app/admin/_components/ui/skeleton";

export default function AdminBlogCommentsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
