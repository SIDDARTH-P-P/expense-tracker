'use client';

import { useState, memo, type PointerEvent } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiCopy, FiEdit2, FiMoreVertical, FiMessageSquare } from 'react-icons/fi';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format';
import { useDuplicateTransaction } from '@/hooks/useTransactions';
import type { Transaction, Category } from '@/types';

const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵',
  card: '💳',
  upi: '📱',
  bank_transfer: '🏦',
  other: '🔗',
};
const SWIPE_DELETE_WIDTH = 72;
const SWIPE_DELETE_TRIGGER = -48;
const SWIPE_DELETE_VELOCITY = -500;

interface TransactionCardProps {
  transaction: Transaction;
  currency: string;
  compact?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
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

function TransactionCardInner({ transaction, currency, compact, onEdit, onDelete }: TransactionCardProps) {
  const [showActions, setShowActions] = useState(false);

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-SWIPE_DELETE_WIDTH, -24], [1, 0]);
  const cardOpacity = useTransform(x, [-SWIPE_DELETE_WIDTH, 0], [0.92, 1]);

  const duplicateTx = useDuplicateTransaction();

  const category = transaction.category as Category;
  const Icon = (Icons[category?.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
  const isIncome = transaction.type === 'income';
  const transactionId = getTransactionId(transaction);
  const canEdit = Boolean(transactionId && onEdit);
  const canDelete = Boolean(transactionId && onDelete);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (canDelete && (info.offset.x <= SWIPE_DELETE_TRIGGER || info.velocity.x <= SWIPE_DELETE_VELOCITY)) {
      setShowActions(false);
      onDelete?.(transaction);
    }
    x.set(0);
  }

  function editTransaction() {
    if (!canEdit) return;
    setShowActions(false);
    onEdit?.(transaction);
  }

  function duplicateTransaction() {
    if (!transactionId) return;
    duplicateTx.mutate(transactionId);
  }

  function requestDeleteTransaction() {
    if (!canDelete) return;
    setShowActions(false);
    onDelete?.(transaction);
  }

  return (
    <div className="relative overflow-hidden rounded-[20px]">
        {canDelete && (
          <motion.button
            type="button"
            style={{ opacity: deleteOpacity }}
            onPointerDown={stopCardDrag}
            onClick={requestDeleteTransaction}
            className="absolute bottom-1 right-1 top-1 flex w-16 items-center justify-center rounded-2xl bg-expense text-expense-foreground shadow-soft"
            aria-label="Delete transaction"
          >
            <span className="flex flex-col items-center gap-0.5">
              <FiTrash2 size={16} />
              <span className="text-[10px] font-bold">Delete</span>
            </span>
          </motion.button>
        )}

        {/* Main card */}
        <motion.div
          drag={canDelete ? 'x' : false}
          dragConstraints={{ left: -SWIPE_DELETE_WIDTH, right: 0 }}
          dragElastic={0.1}
          style={{ x, opacity: cardOpacity }}
          onDragEnd={handleDragEnd}
          className="relative flex touch-pan-y select-none items-start gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border/80 hover:shadow-soft sm:items-center sm:p-3.5 cursor-grab active:cursor-grabbing"
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
                    onClick={editTransaction}
                    onPointerDown={stopCardDrag}
                    disabled={!canEdit}
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
                    onClick={requestDeleteTransaction}
                    onPointerDown={stopCardDrag}
                    disabled={!canDelete}
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
                  onClick={editTransaction}
                  disabled={!canEdit}
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
                  onClick={requestDeleteTransaction}
                  disabled={!canDelete}
                  className="flex min-w-0 items-center justify-center gap-1 rounded-xl bg-expense/10 px-2 py-2.5 text-[11px] font-semibold text-expense min-[380px]:gap-1.5 min-[380px]:text-xs"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

// Memoize to avoid unnecessary re-renders in large lists
export const TransactionCard = memo(TransactionCardInner);
