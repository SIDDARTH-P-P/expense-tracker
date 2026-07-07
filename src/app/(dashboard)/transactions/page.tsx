'use client';

import { useState } from 'react';
import { FiDownload, FiList, FiBook } from 'react-icons/fi';
import { useInfiniteTransactions } from '@/hooks/useTransactions';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterBar } from '@/components/transactions/FilterBar';
import { TransactionList } from '@/components/transactions/TransactionList';
import { CashBookView } from '@/components/transactions/CashBookView';
import { Button } from '@/components/common/Button';
import { useTransactions } from '@/hooks/useTransactions';
import type { TransactionFilters } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils/cn';

type ViewMode = 'list' | 'cashbook';

export default function TransactionsPage() {
  const { data: user } = useCurrentUser();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<Omit<TransactionFilters, 'page'>>({});
  const debouncedSearch = useDebounce(filters.search, 350);

  const activeFilters = { ...filters, search: debouncedSearch };

  // Infinite scroll for list view
  const {
    data: infiniteData,
    isLoading: listLoading,
    isError: listError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchList,
  } = useInfiniteTransactions(activeFilters);

  // All-at-once for cash book view
  const { data: cashbookData, isLoading: cashbookLoading } = useTransactions(
    { ...activeFilters, page: 1, pageSize: 1000 },
    { enabled: viewMode === 'cashbook' }
  );

  const totalCount = infiniteData?.pages[0]?.total ?? 0;

  function exportCSV() {
    const items = infiniteData?.pages.flatMap((p) => p.items) ?? [];
    if (!items.length) return;
    const rows = [
      ['Title', 'Amount', 'Type', 'Category', 'Date', 'Payment Method', 'Note'],
      ...items.map((t) => [
        t.title,
        String(t.amount),
        t.type,
        typeof t.category === 'string' ? t.category : t.category.name,
        new Date(t.date).toLocaleDateString(),
        t.paymentMethod,
        t.note ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgerly-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Transactions</h2>
          <p className="text-xs text-muted mt-0.5">{totalCount} total records</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-2xl border border-border bg-surface p-1 shadow-soft">
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <FiList size={13} /> List
            </button>
            <button
              onClick={() => setViewMode('cashbook')}
              title="Cash Book"
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                viewMode === 'cashbook'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <FiBook size={13} /> Book
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={exportCSV} className="hidden sm:flex">
            <FiDownload size={13} /> CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={(f) => setFilters(f)}
      />

      {/* Content */}
      {viewMode === 'cashbook' ? (
        cashbookLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <CashBookView
            transactions={cashbookData?.items ?? []}
            currency={user?.currency ?? 'USD'}
          />
        )
      ) : (
        <TransactionList
          data={infiniteData}
          currency={user?.currency ?? 'USD'}
          isLoading={listLoading}
          isError={listError}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={!!hasNextPage}
          onRetry={() => refetchList()}
          onFetchNextPage={fetchNextPage}
        />
      )}
    </div>
  );
}
