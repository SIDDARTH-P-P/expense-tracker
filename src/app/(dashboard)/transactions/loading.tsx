import { TransactionRowSkeleton } from '@/components/common/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </div>
  );
}
