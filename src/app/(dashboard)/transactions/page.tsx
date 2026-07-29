'use client';

import { useState, useMemo } from 'react';
import { FiList, FiBook } from 'react-icons/fi';
import { useInfiniteTransactions } from '@/hooks/useTransactions';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterBar } from '@/components/transactions/FilterBar';
import { TransactionList } from '@/components/transactions/TransactionList';
import { CashBookView } from '@/components/transactions/CashBookView';
import { ExportReportModal } from '@/components/transactions/ExportReportModal';
import { useTransactions } from '@/hooks/useTransactions';
import { useUIStore } from '@/store/ui.store';
import type { TransactionFilters } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils/cn';

type ViewMode = 'list' | 'cashbook';

export default function TransactionsPage() {
  const { data: user } = useCurrentUser();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<Omit<TransactionFilters, 'page'>>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 350);

  // Get date range filter state from Zustand
  const dateFilterType = useUIStore((s) => s.dateFilterType);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const selectedYear = useUIStore((s) => s.selectedYear);
  const customStartDate = useUIStore((s) => s.customStartDate);
  const customEndDate = useUIStore((s) => s.customEndDate);

  // Compute from & to date strings based on filters
  const dateParams = useMemo(() => {
    if (filters.from || filters.to) {
      return { from: filters.from, to: filters.to };
    }
    if (dateFilterType === 'all') return { from: undefined, to: undefined };
    if (dateFilterType === 'custom') {
      return { from: customStartDate ?? undefined, to: customEndDate ?? undefined };
    }
    if (dateFilterType === 'month') {
      const from = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const to = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { from, to };
    }
    // year
    return {
      from: `${selectedYear}-01-01`,
      to: `${selectedYear}-12-31`,
    };
  }, [dateFilterType, selectedMonth, selectedYear, customStartDate, customEndDate, filters.from, filters.to]);

  const activeFilters = { 
    ...filters, 
    ...dateParams,
    search: debouncedSearch 
  };

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

  // All-at-once for cash book view or export report
  const { data: cashbookData } = useTransactions(
    { ...activeFilters, page: 1, pageSize: 1000 },
    { enabled: viewMode === 'cashbook' || isExportModalOpen }
  );

  const totalCount = infiniteData?.pages[0]?.total ?? 0;
  const allFilteredItems = cashbookData?.items ?? infiniteData?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Sticky header: title, view toggle, filters */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background px-4 pb-3 pt-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/* Page header */}
        <div className="mb-3 flex items-center justify-between gap-3">
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
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onChange={(f) => setFilters(f)}
          totalRecords={totalCount}
          onOpenExport={() => setIsExportModalOpen(true)}
        />
      </div>

      {/* Content */}
      <div className="pt-3">
        {viewMode === 'cashbook' ? (
          <CashBookView
            transactions={allFilteredItems}
            currency={user?.currency ?? 'USD'}
          />
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

      {/* Report Download Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={allFilteredItems}
        activeFilters={activeFilters}
      />
    </div>
  );
}
