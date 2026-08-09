'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/format';
import type { Transaction, Notebook } from '@/types';
import {
  FiBook,
  FiCalendar,
  FiArrowUpRight,
  FiArrowDownRight,
  FiArrowLeft,
  FiPlus,
  FiLayers,
  FiX,
  FiCheck,
  FiChevronRight,
  FiBookmark,
  FiLoader,
} from 'react-icons/fi';
import { BsPinAngleFill, BsPinAngle } from 'react-icons/bs';
import { cn } from '@/lib/utils/cn';
import { BottomSheet } from '@/components/common/BottomSheet';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CreateBookModal } from '@/components/notebooks/CreateBookModal';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { SplitModal } from '@/components/management/SplitModal';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionRowSkeleton } from '@/components/common/Skeleton';
import { useDeleteTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { useSplit } from '@/hooks/useManagement';
import { useNotebooks, useCreateNotebook, useTogglePinNotebook } from '@/hooks/useNotebooks';
import { getNotebookPalette } from '@/lib/utils/notebook-colors';

interface CashBookViewProps {
  transactions: Transaction[];
  currency: string;
  selectedNotebookId?: string | null;
  onSelectNotebook?: (id: string | null) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
}

type TransactionWithMongoId = Transaction & { _id?: string | { toString(): string } };

function getTransactionId(transaction?: Transaction | null) {
  if (!transaction) return '';
  const mongoId = (transaction as TransactionWithMongoId)._id;
  if (transaction.id) return transaction.id;
  if (typeof mongoId === 'string') return mongoId;
  return mongoId?.toString() ?? '';
}

function parseSafeDate(dateStr?: string | Date): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

  const str = String(dateStr).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateLabel(dateStr?: string | Date): string {
  const d = parseSafeDate(dateStr);
  if (!d) return 'UNKNOWN DATE';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'TODAY';
  if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
  return d
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
    .toUpperCase();
}

interface DayGroup {
  dateKey: string;
  label: string;
  items: Transaction[];
  dayIncome: number;
  dayExpense: number;
}

export function CashBookView({
  transactions,
  currency,
  selectedNotebookId: propSelectedNotebookId,
  onSelectNotebook,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}: CashBookViewProps) {
  const { data: notebooksData } = useNotebooks();
  const userNotebooks = notebooksData?.notebooks ?? [];
  const createNotebookMutation = useCreateNotebook();
  // Sort user notebooks so PINNED BOOKS SHOW FIRST
  const sortedUserNotebooks = useMemo(() => {
    return [...userNotebooks].sort((a, b) => {
      const pinA = (a.isPinned || a.isStarred) ? 1 : 0;
      const pinB = (b.isPinned || b.isStarred) ? 1 : 0;
      if (pinB !== pinA) return pinB - pinA;
      return 0;
    });
  }, [userNotebooks]);

  // null = viewing the Book List; string = selected book ID
  const [internalNotebookId, setInternalNotebookId] = useState<string | null>(null);
  const selectedNotebookId = propSelectedNotebookId !== undefined ? propSelectedNotebookId : internalNotebookId;
  const setSelectedNotebookId = (id: string | null) => {
    if (onSelectNotebook) {
      onSelectNotebook(id);
    }
    setInternalNotebookId(id);
  };

  const [isCreatingBook, setIsCreatingBook] = useState(false);

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [pinningNotebook, setPinningNotebook] = useState<Notebook | null>(null);
  const togglePinMutation = useTogglePinNotebook();

  // Incremental 20-item infinite scroll state inside book
  const [visibleLimit, setVisibleLimit] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  // Compute stats per notebook
  const notebookStats = useMemo(() => {
    const map = new Map<string, { count: number; income: number; expense: number; net: number }>();

    for (const tx of transactions) {
      const nbId = typeof tx.notebook === 'object' ? tx.notebook?.id : tx.notebook;
      const key = nbId ?? 'UNASSIGNED';

      const current = map.get(key) ?? { count: 0, income: 0, expense: 0, net: 0 };
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        current.income += amount;
      } else {
        current.expense += amount;
      }
      current.count += 1;
      current.net = current.income - current.expense;
      map.set(key, current);
    }

    return map;
  }, [transactions]);

  // Overall totals across all transactions
  const totalAllIncome = useMemo(
    () => transactions.reduce((s, tx) => s + (tx.type === 'income' ? tx.amount : 0), 0),
    [transactions]
  );
  const totalAllExpense = useMemo(
    () => transactions.reduce((s, tx) => s + (tx.type === 'expense' ? tx.amount : 0), 0),
    [transactions]
  );
  const totalAllNet = totalAllIncome - totalAllExpense;

  // Filter transactions based on selected notebook
  const filteredTransactions = useMemo(() => {
    if (!selectedNotebookId || selectedNotebookId === 'ALL') return transactions;
    if (selectedNotebookId === 'UNASSIGNED') {
      return transactions.filter((tx) => !tx.notebook);
    }
    return transactions.filter((tx) => {
      const nbId = typeof tx.notebook === 'object' ? tx.notebook?.id : tx.notebook;
      return nbId === selectedNotebookId;
    });
  }, [transactions, selectedNotebookId]);

  // Reset limit to 20 whenever active book or transaction count changes
  useEffect(() => {
    setVisibleLimit(20);
  }, [selectedNotebookId, filteredTransactions.length]);

  // Displayed transactions: in API pagination mode (onFetchNextPage present), display all API-fetched items directly.
  // Otherwise fallback to 20-item client slicing.
  const displayedTransactions = useMemo(() => {
    if (onFetchNextPage) return filteredTransactions;
    return filteredTransactions.slice(0, visibleLimit);
  }, [filteredTransactions, visibleLimit, onFetchNextPage]);

  // IntersectionObserver callback for next API page fetching or client slicing
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        if (onFetchNextPage) {
          if (hasNextPage && !isFetchingNextPage) {
            onFetchNextPage();
          }
        } else if (visibleLimit < filteredTransactions.length) {
          setVisibleLimit((prev) => Math.min(prev + 20, filteredTransactions.length));
        }
      }
    },
    [hasNextPage, isFetchingNextPage, onFetchNextPage, filteredTransactions.length, visibleLimit]
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(observerCallback, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback]);

  // Group filtered & displayed transactions by date
  const { dayGroups, totalIncome, totalExpense, finalBalance } = useMemo(() => {
    const sortedAll = [...filteredTransactions].sort((a, b) => {
      const dateA = parseSafeDate(a.date);
      const dateB = parseSafeDate(b.date);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return timeB - timeA;
    });

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of sortedAll) {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') totalIncome += amount;
      else totalExpense += amount;
    }

    const sortedDisplayed = [...displayedTransactions].sort((a, b) => {
      const dateA = parseSafeDate(a.date);
      const dateB = parseSafeDate(b.date);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return timeB - timeA;
    });

    const map = new Map<string, Transaction[]>();
    for (const tx of sortedDisplayed) {
      const d = parseSafeDate(tx.date);
      const dateKey = d
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : 'UNKNOWN';
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(tx);
    }

    const dayGroups: DayGroup[] = [];

    for (const [dateKey, items] of map.entries()) {
      const dayIncome = items.reduce((s, e) => s + (e.type === 'income' ? (Number(e.amount) || 0) : 0), 0);
      const dayExpense = items.reduce((s, e) => s + (e.type === 'expense' ? (Number(e.amount) || 0) : 0), 0);

      dayGroups.push({
        dateKey,
        label: formatDateLabel(items[0]?.date),
        items,
        dayIncome,
        dayExpense,
      });
    }

    return { dayGroups, totalIncome, totalExpense, finalBalance: totalIncome - totalExpense };
  }, [filteredTransactions, displayedTransactions]);

  const activeNotebook = userNotebooks.find((n) => n.id === selectedNotebookId);



  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      {selectedNotebookId === null ? (
        /* LEVEL 1: COMPACT SLEEK BOOK LIST VIEW */
        <div className="flex flex-col gap-3 animate-fade-in pb-6">
          {/* Books Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <FiBookmark className="text-primary" size={16} /> Transaction Books
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingBook(true)}
              className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <FiPlus size={14} /> New Book
            </button>
          </div>

          {/* Master Card: All Combined */}
          <div
            onClick={() => setSelectedNotebookId('ALL')}
            className="group flex items-center justify-between rounded-2xl border border-primary/40 bg-surface p-3 transition-colors hover:border-primary cursor-pointer shadow-soft"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <FiLayers size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold text-foreground">All Ledgers Combined</p>
                  <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                    Master
                  </span>
                </div>
                <p className="text-[10px] text-muted">{transactions.length} entries total</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <p className={cn("text-xs font-bold", totalAllNet >= 0 ? "text-income" : "text-expense")}>
                {totalAllNet >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalAllNet), currency)}
              </p>
              <FiChevronRight size={16} className="text-muted group-hover:text-primary transition-colors" />
            </div>
          </div>

          {/* Compact Book Cards List */}
          <div className="flex flex-col gap-2">
            {sortedUserNotebooks.map((nb) => {
              const stats = notebookStats.get(nb.id) ?? { count: 0, income: 0, expense: 0, net: 0 };
              const isPinned = Boolean(nb.isPinned || nb.isStarred);
              const palette = getNotebookPalette(nb.name, nb.id);

              return (
                <div
                  key={nb.id}
                  onClick={() => setSelectedNotebookId(nb.id)}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-3 transition-all hover:border-primary/50 cursor-pointer hover:shadow-soft"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold text-base", palette.bg)}>
                      {palette.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {nb.name}
                        </p>
                        {isPinned && (
                          <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <BsPinAngleFill size={10} className="text-amber-400 fill-amber-400" /> Pinned
                          </span>
                        )}
                        {nb.isAutoMonthly ? (
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            Monthly
                          </span>
                        ) : (
                          <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[9px] font-bold text-muted">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted">
                        {stats.count} entries · {nb.recordId ?? 'NBK'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinningNotebook(nb);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-xl hover:bg-surface-2 transition-colors"
                      title={isPinned ? 'Unpin book' : 'Pin book'}
                    >
                      {isPinned ? (
                        <BsPinAngleFill size={16} className="text-amber-400 fill-amber-400" />
                      ) : (
                        <BsPinAngle size={16} className="text-muted hover:text-amber-400" />
                      )}
                    </button>
                    <p className={cn("text-xs font-bold", stats.net >= 0 ? "text-income" : "text-expense")}>
                      {stats.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(stats.net), currency)}
                    </p>
                    <FiChevronRight size={16} className="text-muted group-hover:text-primary transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LEVEL 2: INSIDE A BOOK — Renders TransactionCards */
        <div className="flex flex-col gap-3 animate-fade-in pb-6">
      {/* Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted rounded-2xl border border-dashed border-border bg-surface-2/30 p-6">
          <FiBook size={24} className="text-primary" />
          <h3 className="text-xs font-bold text-foreground">No Transactions Found</h3>
          <p className="text-[11px] text-muted max-w-xs">
            No transaction records logged in "{activeNotebook?.name ?? 'this book'}".
          </p>
        </div>
      ) : (
        /* EXACT TRANSACTION LIST MATCH: Render Date groups with TransactionCards */
        <div className="flex flex-col gap-4">
          {dayGroups.map((group) => (
            <div key={group.dateKey}>
              {/* Date Group Header — Exact match to TransactionList */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              {/* Transaction Cards List */}
              <div className="flex flex-col gap-2">
                {group.items.map((tx, idx) => (
                  <TransactionCard
                    key={getTransactionId(tx) || tx.id || tx.recordId || `cb-tx-${group.dateKey}-${idx}`}
                    transaction={tx}
                    currency={currency}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                    onView={setViewing}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Dedicated sentinel div for IntersectionObserver */}
          {(onFetchNextPage ? hasNextPage : visibleLimit < filteredTransactions.length) && (
            <div ref={loadMoreRef} className="h-4 w-full" />
          )}

          {/* Infinite Scroll Loading Spinner */}
          {(isFetchingNextPage || (!onFetchNextPage && visibleLimit < filteredTransactions.length)) ? (
            <div className="flex justify-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <FiLoader size={20} className="text-primary" />
              </motion.div>
            </div>
          ) : (onFetchNextPage ? (!hasNextPage && !isFetchingNextPage && filteredTransactions.length > 0) : filteredTransactions.length > 20) ? (
            <p className="py-4 text-center text-xs text-muted">
              All {filteredTransactions.length} transactions loaded
            </p>
          ) : null}
        </div>
      )}
    </div>
  )}

      {/* Edit Transaction Bottom Sheet */}
      <BottomSheet
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit transaction"
        showHeader={false}
        className="h-[100dvh] max-h-[100dvh] rounded-none border-0 bg-surface p-0 sm:h-[92vh] sm:max-w-[430px] sm:rounded-2xl sm:border sm:p-0"
      >
        {editing && (
          <TransactionForm
            initialData={editing}
            isSubmitting={updateTx.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(values) => {
              const transactionId = getTransactionId(editing);
              if (!transactionId) return;
              updateTx.mutate(
                { id: transactionId, input: values },
                { onSuccess: () => setEditing(null) }
              );
            }}
          />
        )}
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete transaction?"
        description="This entry will be permanently removed from your records."
        confirmLabel="Delete"
        isLoading={deleteTx.isPending}
        onConfirm={() => {
          const transactionId = getTransactionId(deleting);
          if (!transactionId) return;
          deleteTx.mutate(transactionId, { onSuccess: () => setDeleting(null) });
        }}
        onCancel={() => setDeleting(null)}
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



      {/* Create New Book Popup Modal */}
      <CreateBookModal
        isOpen={isCreatingBook}
        onClose={() => setIsCreatingBook(false)}
        onCreated={(created) => setSelectedNotebookId(created.id)}
      />

      {/* View Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="Transaction details"
        showHeader={false}
        className="h-[100dvh] max-h-[100dvh] rounded-none border-0 bg-surface p-0 sm:h-[92vh] sm:max-w-[430px] sm:rounded-2xl sm:border sm:p-0"
      >
        {viewing && (
          viewing.splitId ? (
            <div className="flex h-full min-h-0 flex-col bg-surface text-foreground">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:h-[74px] sm:px-5">
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center text-foreground sm:h-11 sm:w-11"
                  aria-label="Back"
                >
                  <FiArrowLeft size={28} strokeWidth={2.2} />
                </button>
                <h2 className="min-w-0 flex-1 truncate px-2 text-center text-xl font-semibold leading-tight tracking-normal sm:px-4 sm:text-[28px] text-primary">
                  Split Details
                </h2>
                <div className="w-10 sm:w-11" />
              </div>

              <div className="flex-1 min-h-0">
                <SplitModalWrapper
                  transaction={viewing}
                  onClose={() => setViewing(null)}
                  onEdit={() => {
                    const txId = getTransactionId(viewing);
                    setViewing(null);
                    if (txId) {
                      setEditing(viewing);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <TransactionForm
              initialData={viewing}
              readOnly={true}
              onCancel={() => setViewing(null)}
              onEdit={() => {
                const txId = getTransactionId(viewing);
                setViewing(null);
                if (txId) {
                  setEditing(viewing);
                }
              }}
              onSubmit={() => {}}
            />
          )
        )}
      </BottomSheet>
    </>
  );
}

function SplitModalWrapper({ transaction, onClose, onEdit }: { transaction: Transaction; onClose: () => void; onEdit: () => void }) {
  const { data: split } = useSplit(transaction.splitId);
  return split ? (
    <SplitModal
      split={split}
      readOnly={true}
      onClose={onClose}
      onEdit={onEdit}
    />
  ) : (
    <div className="flex items-center justify-center py-8">
      <span className="text-sm text-muted">Loading split details...</span>
    </div>
  );
}
