import { Skeleton } from "@/app/admin/_components/ui/skeleton";

export default function AdminPublicMediaLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
