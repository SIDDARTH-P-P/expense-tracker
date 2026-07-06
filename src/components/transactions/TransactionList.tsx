'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TransactionCard } from './TransactionCard';
import { TransactionRowSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { FiInbox, FiLoader } from 'react-icons/fi';
import type { Transaction } from '@/types';
import type { InfiniteData } from '@tanstack/react-query';
import type { PaginatedResult } from '@/types';

interface TransactionListProps {
  data?: InfiniteData<PaginatedResult<Transaction>>;
  currency: string;
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onRetry: () => void;
  onFetchNextPage: () => void;
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

export function TransactionList({
  data,
  currency,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  onRetry,
  onFetchNextPage,
}: TransactionListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for infinite scroll
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onFetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, onFetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(observerCallback, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback]);

  // Flatten pages into one array
  const allItems = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of allItems) {
      const label = getDateLabel(tx.date);
      const arr = map.get(label) ?? [];
      arr.push(tx);
      map.set(label, arr);
    }
    return [...map.entries()];
  }, [allItems]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={onRetry} />;

  if (allItems.length === 0) {
    return (
      <EmptyState
        icon={FiInbox}
        title="No transactions found"
        description="Try adjusting your filters, or add a new transaction to get started."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(([label, items], gi) => (
        <div key={label}>
          {/* Date group header */}
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <div className="flex flex-col gap-2">
            {items.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(gi * 0.03 + i * 0.03, 0.25), duration: 0.25 }}
                style={{ contentVisibility: 'auto' }}
              >
                <TransactionCard transaction={tx} currency={currency} />
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-1" />

      {/* Loading more spinner */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <FiLoader size={20} className="text-primary" />
          </motion.div>
        </div>
      )}

      {/* End of list */}
      {!hasNextPage && allItems.length > 0 && (
        <p className="py-4 text-center text-xs text-muted">
          All {allItems.length} transactions loaded
        </p>
      )}
    </div>
  );
}
