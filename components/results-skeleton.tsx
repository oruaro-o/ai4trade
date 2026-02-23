"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ResultsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading classification results">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-6 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-52" />
              </div>
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-8 ml-auto" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <Skeleton className="h-1 w-full rounded-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
