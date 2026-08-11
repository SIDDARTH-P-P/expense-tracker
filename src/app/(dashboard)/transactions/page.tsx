'use client';

import { useState, useMemo, useEffect } from 'react';
import { FiList, FiBook, FiArrowLeft } from 'react-icons/fi';
import { BsPinAngleFill, BsPinAngle } from 'react-icons/bs';
import { useInfiniteTransactions } from '@/hooks/useTransactions';
import { useCurrentUser } from '@/hooks/useAuth';
import { useNotebooks, useTogglePinNotebook } from '@/hooks/useNotebooks';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterBar } from '@/components/transactions/FilterBar';
import { TransactionList } from '@/components/transactions/TransactionList';
import { CashBookView } from '@/components/transactions/CashBookView';
import { ExportReportModal } from '@/components/transactions/ExportReportModal';
import { CreateMonthlyBookModal } from '@/components/notebooks/CreateMonthlyBookModal';
import { useTransactions } from '@/hooks/useTransactions';
import { useUIStore } from '@/store/ui.store';
import type { TransactionFilters } from '@/hooks/useTransactions';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { Notebook } from '@/types';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { getNotebookPalette } from '@/lib/utils/notebook-colors';

type ViewMode = 'list' | 'cashbook';

export default function TransactionsPage() {
  const { data: user } = useCurrentUser();
  const { data: notebooksData } = useNotebooks();
  const togglePinMutation = useTogglePinNotebook();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Omit<TransactionFilters, 'page'>>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [hasPromptedModal, setHasPromptedModal] = useState(false);
  const [isMonthlyBookModalOpen, setIsMonthlyBookModalOpen] = useState(false);
  const [pinningNotebook, setPinningNotebook] = useState<Notebook | null>(null);

  const activeMonthStatus = notebooksData?.activeMonthStatus;
  const userNotebooks = useMemo(() => notebooksData?.notebooks ?? [], [notebooksData?.notebooks]);

  const isBookOpen = viewMode === 'cashbook' && selectedNotebookId !== null;

  const activeNotebook = useMemo(
    () => userNotebooks.find((n) => n.id === selectedNotebookId),
    [userNotebooks, selectedNotebookId]
  );

  const activeBookName = useMemo(() => {
    if (!selectedNotebookId) return '';
    if (selectedNotebookId === 'ALL') return 'All Ledgers Combined';
    if (selectedNotebookId === 'UNASSIGNED') return 'Unassigned Transactions';
    return activeNotebook?.name ?? 'Book';
  }, [selectedNotebookId, activeNotebook]);

  useEffect(() => {
    if (activeMonthStatus && !activeMonthStatus.exists && !hasPromptedModal) {
      setIsMonthlyBookModalOpen(true);
      setHasPromptedModal(true);
    }
  }, [activeMonthStatus, hasPromptedModal]);

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

  const activeFilters = useMemo(
    () => ({
      ...filters,
      ...dateParams,
      search: debouncedSearch,
    }),
    [filters, dateParams, debouncedSearch]
  );

  const bookFilters = useMemo(
    () => ({
      ...activeFilters,
      notebook: selectedNotebookId ?? undefined,
    }),
    [activeFilters, selectedNotebookId]
  );

  // Infinite scroll query — pass bookFilters when inside a book in cashbook mode
  const {
    data: infiniteData,
    isLoading: listLoading,
    isError: listError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchList,
  } = useInfiniteTransactions(
    viewMode === 'cashbook' && selectedNotebookId !== null ? bookFilters : activeFilters
  );

  // Refetch query on notebook or view mode change to reset pagination
  useEffect(() => {
    if (viewMode === 'cashbook' && selectedNotebookId !== null) {
      refetchList();
    }
  }, [selectedNotebookId, viewMode, refetchList]);

  // All-at-once for export report or book list shelf
  const { data: cashbookData, isLoading: cashbookLoading } = useTransactions(
    { ...activeFilters, page: 1, pageSize: 1000 },
    { enabled: (viewMode === 'cashbook' && selectedNotebookId === null) || isExportModalOpen }
  );

  const totalCount = infiniteData?.pages[0]?.total ?? 0;
  const allFilteredItems = cashbookData?.items ?? infiniteData?.pages.flatMap((p) => p.items) ?? [];

  const activeBookTxCount = useMemo(() => {
    if (!selectedNotebookId) return 0;
    if (selectedNotebookId === 'ALL') return allFilteredItems.length;
    if (selectedNotebookId === 'UNASSIGNED') return allFilteredItems.filter((tx) => !tx.notebook).length;
    return allFilteredItems.filter((tx) => {
      const nbId = typeof tx.notebook === 'object' ? tx.notebook?.id : tx.notebook;
      return nbId === selectedNotebookId;
    }).length;
  }, [selectedNotebookId, allFilteredItems]);

  const { bookIncome, bookExpense, bookNet } = useMemo(() => {
    if (!selectedNotebookId) return { bookIncome: 0, bookExpense: 0, bookNet: 0 };
    let filtered = allFilteredItems;
    if (selectedNotebookId !== 'ALL') {
      if (selectedNotebookId === 'UNASSIGNED') {
        filtered = allFilteredItems.filter((tx) => !tx.notebook);
      } else {
        filtered = allFilteredItems.filter((tx) => {
          const nbId = typeof tx.notebook === 'object' ? tx.notebook?.id : tx.notebook;
          return nbId === selectedNotebookId;
        });
      }
    }
    let inc = 0;
    let exp = 0;
    for (const tx of filtered) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') inc += amt;
      else exp += amt;
    }
    return { bookIncome: inc, bookExpense: exp, bookNet: inc - exp };
  }, [selectedNotebookId, allFilteredItems]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'list') {
      setSelectedNotebookId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Sticky header: title / book header, view toggle, filters, summary card */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background px-4 pb-3 pt-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/* Page header / Book header section */}
        {isBookOpen ? (
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedNotebookId(null)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-xs font-bold text-foreground shadow-xs hover:bg-surface-2 active:scale-95 transition-all shrink-0"
                title="Back to Books shelf"
              >
                <FiArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {(() => {
                    const palette = activeNotebook ? getNotebookPalette(activeNotebook.name, activeNotebook.id) : null;
                    return (
                      <h2 className="font-display text-lg font-bold truncate text-foreground flex items-center gap-2">
                        {palette ? (
                          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base font-bold", palette.bg)}>
                            {palette.icon}
                          </span>
                        ) : (
                          <span>📘</span>
                        )}
                        {activeBookName}
                      </h2>
                    );
                  })()}
                  {activeNotebook && (
                    <button
                      type="button"
                      onClick={() => setPinningNotebook(activeNotebook)}
                      className="p-1 rounded-lg hover:bg-surface-2 transition-colors shrink-0"
                      title={Boolean(activeNotebook.isPinned || activeNotebook.isStarred) ? 'Unpin book' : 'Pin book'}
                    >
                      {Boolean(activeNotebook.isPinned || activeNotebook.isStarred) ? (
                        <BsPinAngleFill size={16} className="text-amber-400 fill-amber-400" />
                      ) : (
                        <BsPinAngle size={16} className="text-muted hover:text-amber-400" />
                      )}
                    </button>
                  )}
                  {activeNotebook?.isAutoMonthly ? (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      Monthly
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted mt-0.5">{activeBookTxCount} entries logged in book</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">
                {viewMode === 'cashbook' ? 'Cash Books' : 'Transactions'}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {viewMode === 'cashbook'
                  ? `${userNotebooks.length} ${userNotebooks.length === 1 ? 'book' : 'books'}`
                  : `${totalCount} ${totalCount === 1 ? 'record' : 'records'}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center rounded-2xl border border-border bg-surface p-1 shadow-soft">
                <button
                  onClick={() => handleViewModeChange('list')}
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
                  onClick={() => handleViewModeChange('cashbook')}
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
        )}

        {/* Filters — Hide report download option in cash book mode */}
        <FilterBar
          filters={filters}
          onChange={(f) => setFilters(f)}
          totalRecords={isBookOpen ? activeBookTxCount : totalCount}
          onOpenExport={viewMode === 'cashbook' ? undefined : () => setIsExportModalOpen(true)}
          hideExport={viewMode === 'cashbook'}
        />

        {/* 100% Truly Sticky Book Summary Card */}
        {isBookOpen && (
          <div className="mt-2.5 rounded-xl border border-border bg-surface p-2 shadow-soft">
            <div className="grid grid-cols-3 gap-1 text-center divide-x divide-border/60">
              <div className="px-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-income block">CREDIT (IN)</span>
                <p className="text-xs font-extrabold text-income mt-0.5">{formatCurrency(bookIncome, user?.currency ?? 'INR')}</p>
              </div>
              <div className="px-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-expense block">DEBIT (OUT)</span>
                <p className="text-xs font-extrabold text-expense mt-0.5">{formatCurrency(bookExpense, user?.currency ?? 'INR')}</p>
              </div>
              <div className="px-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted block">NET</span>
                <p className={cn("text-xs font-extrabold mt-0.5", bookNet >= 0 ? "text-income" : "text-expense")}>
                  {bookNet >= 0 ? '+' : '-'}{formatCurrency(Math.abs(bookNet), user?.currency ?? 'INR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-3">
        {viewMode === 'cashbook' ? (
          <CashBookView
            transactions={
              isBookOpen
                ? (infiniteData?.pages.flatMap((p) => p.items) ?? [])
                : allFilteredItems
            }
            currency={user?.currency ?? 'INR'}
            selectedNotebookId={selectedNotebookId}
            onSelectNotebook={setSelectedNotebookId}
            isLoading={isBookOpen ? listLoading : cashbookLoading}
            hasNextPage={isBookOpen ? !!hasNextPage : false}
            isFetchingNextPage={isBookOpen ? isFetchingNextPage : false}
            onFetchNextPage={fetchNextPage}
          />
        ) : (
          <TransactionList
            data={infiniteData}
            currency={user?.currency ?? 'INR'}
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

      {/* Monthly Book Prompt Modal */}
      <CreateMonthlyBookModal
        isOpen={isMonthlyBookModalOpen}
        onClose={() => setIsMonthlyBookModalOpen(false)}
        monthBookName={activeMonthStatus?.name ?? 'Current Month'}
      />

      {/* Pin / Unpin Book Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!pinningNotebook}
        title={
          Boolean(pinningNotebook?.isPinned || pinningNotebook?.isStarred)
            ? `Unpin "${pinningNotebook?.name}"?`
            : `Pin "${pinningNotebook?.name}"?`
        }
        description={
          Boolean(pinningNotebook?.isPinned || pinningNotebook?.isStarred)
            ? `This book will be unpinned from the top of your transaction books list.`
            : `This book will be pinned to the top of your transaction books list.`
        }
        confirmLabel={
          Boolean(pinningNotebook?.isPinned || pinningNotebook?.isStarred)
            ? 'Unpin Book'
            : 'Pin Book'
        }
        isDangerous={false}
        isLoading={togglePinMutation.isPending}
        onConfirm={() => {
          if (!pinningNotebook) return;
          const isCurrentlyPinned = Boolean(pinningNotebook.isPinned || pinningNotebook.isStarred);
          togglePinMutation.mutate(
            { notebookId: pinningNotebook.id, targetState: !isCurrentlyPinned },
            {
              onSuccess: () => setPinningNotebook(null),
            }
          );
        }}
        onCancel={() => setPinningNotebook(null)}
      />


    </div>
  );
}
