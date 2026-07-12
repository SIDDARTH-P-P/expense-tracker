'use client';

import { useState, memo, type PointerEvent } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiCopy, FiEdit2, FiMoreVertical, FiMessageSquare } from 'react-icons/fi';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/format';
import { useDuplicateTransaction } from '@/hooks/useTransactions';
import { useCurrentUser } from '@/hooks/useAuth';
import { useSplit, useMarkSplitPaid } from '@/hooks/useManagement';
import { BottomSheet } from '@/components/common/BottomSheet';
import { cn } from '@/lib/utils/cn';
import type { Transaction, Category, Split, SplitUser } from '@/types';

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

function splitUserName(value: SplitUser | string) {
  return typeof value === 'string' ? 'Unknown' : value.name;
}

function getSplitUserId(value: SplitUser | string) {
  return typeof value === 'string' ? value : value.id;
}

function stopCardDrag(event: PointerEvent<HTMLButtonElement>) {
  event.stopPropagation();
}

function TransactionCardInner({ transaction, currency, compact, onEdit, onDelete }: TransactionCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showSplitDetails, setShowSplitDetails] = useState(false);
  const { data: user } = useCurrentUser();
  const { data: split } = useSplit(showSplitDetails ? transaction.splitId : null);
  const markSplitPaid = useMarkSplitPaid();

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

        <motion.div
          drag={canDelete ? 'x' : false}
          dragConstraints={{ left: -SWIPE_DELETE_WIDTH, right: 0 }}
          dragElastic={0.1}
          style={{ x, opacity: cardOpacity }}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (transaction.splitId) {
              setShowSplitDetails(true);
            } else if (onEdit) {
              onEdit(transaction);
            }
          }}
          className={cn(
            "relative flex touch-pan-y select-none items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border/80 hover:shadow-soft sm:p-3.5 cursor-pointer",
            !transaction.splitId && "active:scale-[0.99]"
          )}
        >
          {/* Category icon */}
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-soft"
            style={{ backgroundColor: `${category?.color ?? '#888'}18`, color: category?.color ?? '#888' }}
          >
            <Icon size={18} />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center flex-wrap gap-1.5">
              <p className="truncate text-sm font-semibold">{transaction.title}</p>
              {transaction.splitId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                  Split {transaction.splitMembersCount ? `· ${transaction.splitMembersCount} Members` : ''}
                </span>
              )}
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
              {/* {transaction.recordId && (
                <>
                  <span className="hidden opacity-40 sm:inline">·</span>
                  <span className="whitespace-nowrap font-mono text-[10px] uppercase text-primary">{transaction.recordId}</span>
                </>
              )} */}
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
            <div className="flex items-center gap-1.5">
              {/* Payment method badge */}
              <span
                className="inline-flex h-5 items-center justify-center shrink-0 rounded-lg bg-surface-2 px-1.5 text-[11px] text-muted"
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
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <FiEdit2 size={12} />
                  </button>
                  <button
                    onClick={duplicateTransaction}
                    onPointerDown={stopCardDrag}
                    disabled={!transactionId || duplicateTx.isPending}
                    aria-label="Duplicate"
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    <FiCopy size={12} />
                  </button>
                  <button
                    onClick={requestDeleteTransaction}
                    onPointerDown={stopCardDrag}
                    disabled={!canDelete}
                    aria-label="Delete"
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-muted transition-colors hover:bg-expense/10 hover:text-expense"
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
                  className="sm:hidden flex h-7.5 w-7.5 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
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

        {/* View detail sheet */}
        <BottomSheet isOpen={showSplitDetails} onClose={() => setShowSplitDetails(false)} title="Split details">
          {split ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Record ID</p>
                <p className="font-mono text-sm font-semibold text-primary">{split.recordId}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Title</p>
                <p className="text-lg font-semibold">{split.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-surface p-3">
                  <p className="text-xs text-muted">Amount</p>
                  <p className="font-mono font-bold text-primary">{formatCurrency(split.amount, currency)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-3">
                  <p className="text-xs text-muted">Paid by</p>
                  <p className="truncate font-semibold">{splitUserName(split.paidBy)}</p>
                </div>
              </div>

              {(() => {
                const payerId = getSplitUserId(split.paidBy);
                const nonPayers = split.members.filter((m) => getSplitUserId(m.userId) !== payerId);
                const paidNonPayers = nonPayers.filter((m) => m.paid);
                const totalNonPayers = nonPayers.length;
                const paidCount = paidNonPayers.length;
                const progressPercent = totalNonPayers > 0 ? (paidCount / totalNonPayers) * 100 : 100;

                return (
                  <>
                    {/* Progress section */}
                    <div className="rounded-2xl border border-border bg-surface p-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted">Settlement Progress</span>
                        <span className="text-primary font-mono">{paidCount} of {totalNonPayers} Paid</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-muted">Members Share</p>
                      {split.members.map((member) => {
                        const memberId = getSplitUserId(member.userId);
                        const isPayer = memberId === payerId;
                        const memberEmail = typeof member.userId === 'string' ? '' : member.userId.email;
                        const isMe = user?.email?.toLowerCase() === memberEmail.toLowerCase();
                        
                        // Can mark paid if it's the logged-in user themselves, they are not the payer, and they haven't paid yet
                        const canMarkPaid = isMe && !isPayer && !member.paid;

                        return (
                          <div
                            key={memberId}
                            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold">{splitUserName(member.userId)}</p>
                                {isPayer && (
                                  <span className="rounded-full bg-primary/10 px-1 py-0.2 text-[8px] font-bold uppercase text-primary">
                                    Payer
                                  </span>
                                )}
                              </span>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span
                                  className={cn(
                                    'rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide',
                                    member.paid ? 'bg-income/10 text-income' : 'bg-surface-2 text-muted border border-border'
                                  )}
                                >
                                  {member.paid ? 'Paid' : 'Unpaid'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <p className="font-mono text-sm font-semibold">{formatCurrency(member.shareAmount, currency)}</p>
                              {canMarkPaid && (
                                <button
                                  type="button"
                                  disabled={markSplitPaid.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markSplitPaid.mutate(
                                      { splitId: split.id, memberId },
                                      {
                                        onSuccess: () => {
                                          // Auto-updates from React Query cache validation
                                        },
                                      }
                                    );
                                  }}
                                  className="rounded-xl bg-income px-3 py-1.5 text-xs font-bold text-income-foreground hover:opacity-90 transition disabled:opacity-50"
                                >
                                  {markSplitPaid.isPending ? 'Saving...' : 'Mark Paid'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-muted">Loading split details...</span>
            </div>
          )}
        </BottomSheet>
      </div>
  );
}

// Memoize to avoid unnecessary re-renders in large lists
export const TransactionCard = memo(TransactionCardInner);
