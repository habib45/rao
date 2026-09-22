import { Skeleton } from "@/app/admin/_components/ui/skeleton";

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
