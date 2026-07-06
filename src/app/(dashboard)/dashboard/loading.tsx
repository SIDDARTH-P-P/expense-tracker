import { CardSkeleton } from '@/components/common/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <CardSkeleton />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
