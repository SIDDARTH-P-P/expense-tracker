'use client';

import { useState, memo, type PointerEvent } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiCopy, FiEdit2, FiMoreVertical, FiMessageSquare } from 'react-icons/fi';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BottomSheet } from '@/components/common/BottomSheet';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useDeleteTransaction, useDuplicateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import type { Transaction, Category } from '@/types';

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵',
  card: '💳',
  upi: '📱',
  bank_transfer: '🏦',
  other: '🔗',
};

interface TransactionCardProps {
  transaction: Transaction;
  currency: string;
  compact?: boolean;
}

type TransactionWithMongoId = Transaction & { _id?: string | { toString(): string } };

function getTransactionId(transaction: Transaction) {
  const mongoId = (transaction as TransactionWithMongoId)._id;
  if (transaction.id) return transaction.id;
  if (typeof mongoId === 'string') return mongoId;
  return mongoId?.toString() ?? '';
}

function stopCardDrag(event: PointerEvent<HTMLButtonElement>) {
  event.stopPropagation();
}

function TransactionCardInner({ transaction, currency, compact }: TransactionCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -30], [1, 0]);
  const cardOpacity = useTransform(x, [-80, 0], [0.85, 1]);

  const deleteTx = useDeleteTransaction();
  const duplicateTx = useDuplicateTransaction();
  const updateTx = useUpdateTransaction();

  const category = transaction.category as Category;
  const Icon = (Icons[category?.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
  const isIncome = transaction.type === 'income';
  const transactionId = getTransactionId(transaction);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -80) setShowDelete(true);
    x.set(0);
  }

  function duplicateTransaction() {
    if (!transactionId) return;
    duplicateTx.mutate(transactionId);
  }

  function deleteTransaction() {
    if (!transactionId) return;
    deleteTx.mutate(transactionId, { onSuccess: () => setShowDelete(false) });
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Swipe-to-delete reveal */}
        <motion.div
          style={{ opacity: deleteOpacity }}
          className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-r-2xl bg-expense"
        >
          <div className="flex flex-col items-center gap-0.5 text-white">
            <FiTrash2 size={16} />
            <span className="text-[10px] font-medium">Delete</span>
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -80, right: 0 }}
          dragElastic={0.1}
          style={{ x, opacity: cardOpacity }}
          onDragEnd={handleDragEnd}
          className="relative flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border/80 hover:shadow-soft sm:items-center sm:p-3.5 cursor-grab active:cursor-grabbing"
        >
          {/* Category icon */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"
            style={{ backgroundColor: `${category?.color ?? '#888'}18`, color: category?.color ?? '#888' }}
          >
            <Icon size={18} />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <p className="truncate text-sm font-semibold">{transaction.title}</p>
              {!compact && transaction.note && (
                <FiMessageSquare size={10} className="shrink-0 text-muted" />
              )}
            </div>
            <div className="mt-1 flex min-w-0 flex-col gap-0.5 text-xs text-muted sm:flex-row sm:items-center sm:gap-1.5">
              <span className="max-w-full truncate sm:max-w-[8rem]">{category?.name ?? '—'}</span>
              <span className="hidden opacity-40 sm:inline">·</span>
              <span className="whitespace-nowrap">
                {formatDate(transaction.date)}
                {!compact && ` · ${formatTime(transaction.date)}`}
              </span>
            </div>
            {/* Note preview */}
            {!compact && transaction.note && (
              <p className="mt-0.5 text-[11px] text-muted truncate italic">&ldquo;{transaction.note}&rdquo;</p>
            )}
          </div>

          {/* Right: amount + actions */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className={`amount max-w-[116px] truncate whitespace-nowrap text-right text-sm font-bold sm:max-w-none ${isIncome ? 'text-income' : 'text-expense'}`}>
              {isIncome ? '+' : '−'}{formatCurrency(transaction.amount, currency)}
            </p>
            <div className="flex items-center gap-1">
              {/* Payment method badge */}
              <span
                className="shrink-0 rounded-lg bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted"
                title={transaction.paymentMethod}
              >
                {PAYMENT_ICONS[transaction.paymentMethod] ?? '💰'}
              </span>

              {/* Desktop action buttons */}
              {!compact && (
                <div className="hidden sm:flex items-center gap-0.5">
                  <button
                    onClick={() => setShowEdit(true)}
                    onPointerDown={stopCardDrag}
                    disabled={!transactionId}
                    aria-label="Edit"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <FiEdit2 size={12} />
                  </button>
                  <button
                    onClick={duplicateTransaction}
                    onPointerDown={stopCardDrag}
                    disabled={!transactionId || duplicateTx.isPending}
                    aria-label="Duplicate"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    <FiCopy size={12} />
                  </button>
                  <button
                    onClick={() => setShowDelete(true)}
                    onPointerDown={stopCardDrag}
                    disabled={!transactionId}
                    aria-label="Delete"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-expense/10 hover:text-expense"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              )}

              {/* Mobile more button */}
              {!compact && (
                <button
                  onClick={() => setShowActions((s) => !s)}
                  onPointerDown={stopCardDrag}
                  disabled={!transactionId}
                  className="sm:hidden rounded-lg p-1.5 text-muted hover:bg-surface-2"
                  aria-label="More actions"
                >
                  <FiMoreVertical size={13} />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Mobile action tray */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 px-1 pb-1 pt-2">
                <button
                  onClick={() => { setShowEdit(true); setShowActions(false); }}
                  disabled={!transactionId}
                  className="flex min-w-0 items-center justify-center gap-1 rounded-xl bg-primary/10 px-2 py-2.5 text-[11px] font-semibold text-primary min-[380px]:gap-1.5 min-[380px]:text-xs"
                >
                  <FiEdit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => { duplicateTransaction(); setShowActions(false); }}
                  disabled={!transactionId || duplicateTx.isPending}
                  className="flex min-w-0 items-center justify-center gap-1 rounded-xl bg-surface-2 px-2 py-2.5 text-[11px] font-semibold min-[380px]:gap-1.5 min-[380px]:text-xs"
                >
                  <FiCopy size={12} /> Duplicate
                </button>
                <button
                  onClick={() => { setShowDelete(true); setShowActions(false); }}
                  disabled={!transactionId}
                  className="flex min-w-0 items-center justify-center gap-1 rounded-xl bg-expense/10 px-2 py-2.5 text-[11px] font-semibold text-expense min-[380px]:gap-1.5 min-[380px]:text-xs"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit sheet */}
      <BottomSheet
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit transaction"
        showHeader={false}
        className="h-[100dvh] max-h-[100dvh] rounded-none border-0 bg-surface p-0 sm:h-[92vh] sm:max-w-[430px] sm:rounded-2xl sm:border sm:p-0"
      >
        <TransactionForm
          initialData={transaction}
          isSubmitting={updateTx.isPending}
          onCancel={() => setShowEdit(false)}
          onSubmit={(values) => {
            if (!transactionId) return;
            updateTx.mutate({ id: transactionId, input: values }, { onSuccess: () => setShowEdit(false) });
          }}
        />
      </BottomSheet>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={showDelete}
        title="Delete transaction?"
        description="This can't be undone. The entry will be permanently removed."
        confirmLabel="Delete"
        isLoading={deleteTx.isPending}
        onConfirm={deleteTransaction}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}

// Memoize to avoid unnecessary re-renders in large lists
export const TransactionCard = memo(TransactionCardInner);
