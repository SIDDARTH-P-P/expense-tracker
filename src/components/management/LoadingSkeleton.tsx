import { Skeleton } from '@/components/common/Skeleton';

export function LoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-8 w-16 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
