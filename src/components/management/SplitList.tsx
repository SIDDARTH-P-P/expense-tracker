'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEye,
  FiGitBranch,
  FiShare2,
  FiTrash2,
  FiEdit2,
  FiMoreVertical,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiArrowLeft,
  FiBell,
  FiCheckSquare,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';
import { BottomSheet } from '@/components/common/BottomSheet';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'react-hot-toast';
import { LoadingSkeleton } from '@/components/management/LoadingSkeleton';
import { SplitModal } from '@/components/management/SplitModal';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDeleteSplit, useSplits, useMarkSplitPaid, useSplitUsers, useSendSplitReminder } from '@/hooks/useManagement';
import { formatCurrency, formatTime } from '@/lib/utils/format';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils/cn';
import type { Split, SplitUser } from '@/types';
import type { SplitFilters } from '@/components/management/SplitExportReportModal';

interface SplitListProps {
  search?: string;
  filters?: SplitFilters;
}

function splitUserName(value: SplitUser | string) {
  return typeof value === 'string' ? 'Unknown' : value.name;
}

function getSplitUserId(value: SplitUser | string) {
  return typeof value === 'string' ? value : value.id;
}

function getSplitUserEmail(value: SplitUser | string) {
  return typeof value === 'string' ? '' : value.email;
}

function formatPaidDateTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${month} ${day} | ${time}`;
}

function getDateLabel(dateStr: string): string {
  if (!dateStr) return 'UNKNOWN DATE';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'UNKNOWN DATE';
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

export function SplitList({ search = '', filters }: SplitListProps) {
  const filterMode = useUIStore((s) => s.splitFilterMode);
  const dateFilterType = useUIStore((s) => s.dateFilterType);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const selectedYear = useUIStore((s) => s.selectedYear);
  const customStartDate = useUIStore((s) => s.customStartDate);
  const customEndDate = useUIStore((s) => s.customEndDate);

  const { data: user } = useCurrentUser();
  const { data: splits = [], isLoading } = useSplits(filters?.search ?? search);
  const { data: splitUsers = [] } = useSplitUsers();
  const deleteSplit = useDeleteSplit();
  const markSplitPaid = useMarkSplitPaid();
  const sendSplitReminder = useSendSplitReminder();
  const [viewing, setViewing] = useState<Split | null>(null);
  const [editing, setEditing] = useState<Split | null>(null);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [showingReceiveMembersForSplitId, setShowingReceiveMembersForSplitId] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<Split | null>(null);
  const [closeReasonInput, setCloseReasonInput] = useState('');
  const [confirmRemind, setConfirmRemind] = useState<Split | null>(null);
  const [confirmReceive, setConfirmReceive] = useState<{ split: Split; member: any } | null>(null);
  const [confirmPaidSelf, setConfirmPaidSelf] = useState<{ split: Split; member: any } | null>(null);
  const currency = user?.currency ?? 'INR';

  // Compute date range params
  const dateParams = useMemo(() => {
    if (filters?.from || filters?.to) {
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
    return {
      from: `${selectedYear}-01-01`,
      to: `${selectedYear}-12-31`,
    };
  }, [dateFilterType, selectedMonth, selectedYear, customStartDate, customEndDate, filters?.from, filters?.to]);

  // Filter & sort splits based on filters prop & ui store
  const filteredSplits = useMemo(() => {
    const myEmail = user?.email?.toLowerCase();
    if (!myEmail) return [];

    const activeScope = filters?.scope ?? filterMode;
    const activeStatus = filters?.status ?? 'All';

    let result = splits.filter((split) => {
      const isPayer = getSplitUserEmail(split.paidBy).toLowerCase() === myEmail;
      const myMember = split.members.find(
        (m) => getSplitUserEmail(m.userId).toLowerCase() === myEmail
      );
      const isMember = !!myMember;

      // 1. Scope Filter
      if (activeScope === 'own' && !isPayer) return false;
      if (activeScope === 'owe' && (isPayer || !myMember || myMember.paid)) return false;
      if (activeScope === 'owed') {
        if (!isPayer) return false;
        const hasPendingOtherMembers = split.members.some(
          (m) => getSplitUserEmail(m.userId).toLowerCase() !== myEmail && !m.paid
        );
        if (!hasPendingOtherMembers) return false;
      }
      if (activeScope === 'all' && !isPayer && !isMember) return false;

      // 2. Status Filter
      if (activeStatus !== 'All' && split.status !== activeStatus) return false;

      // 3. Member Filter
      if (filters?.memberId) {
        const isTargetMember = split.members.some(
          (m) => getSplitUserId(m.userId) === filters.memberId
        );
        const isTargetPayer = getSplitUserId(split.paidBy) === filters.memberId;
        if (!isTargetMember && !isTargetPayer) return false;
      }

      // 4. Date Range Filter
      if (dateParams.from || dateParams.to) {
        const splitDateStr = new Date(split.createdAt).toISOString().split('T')[0];
        if (dateParams.from && splitDateStr < dateParams.from) return false;
        if (dateParams.to && splitDateStr > dateParams.to) return false;
      }

      return true;
    });

    // 5. Sorting
    const sortBy = filters?.sortBy ?? 'date';
    const sortOrder = filters?.sortOrder ?? 'desc';

    result.sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [splits, filterMode, filters, dateParams, user]);

  // Google Pay-style amount summary
  const summary = useMemo(() => {
    const myEmail = user?.email?.toLowerCase();
    if (!myEmail) return { youOwe: 0, owedToYou: 0, settled: 0 };

    let youOwe = 0; // I owe others (I'm a non-payer member, unpaid)
    let owedToYou = 0; // Others owe me (I'm the payer, others unpaid)
    let settled = 0; // Fully settled splits count

    for (const split of splits) {
      const payerEmail = getSplitUserEmail(split.paidBy).toLowerCase();
      const iAmPayer = payerEmail === myEmail;

      if (split.status === 'Completed' || split.status === 'Closed') {
        settled++;
        continue;
      }

      if (iAmPayer) {
        // I paid — others owe me their unpaid shares
        for (const m of split.members) {
          if (getSplitUserEmail(m.userId).toLowerCase() !== payerEmail && !m.paid) {
            owedToYou += m.shareAmount;
          }
        }
      } else {
        // I didn't pay — check if I owe
        const myMember = split.members.find(
          (m) => getSplitUserEmail(m.userId).toLowerCase() === myEmail
        );
        if (myMember && !myMember.paid) {
          youOwe += myMember.shareAmount;
        }
      }
    }

    return { youOwe, owedToYou, settled };
  }, [splits, user]);

  // Group splits by date
  const groupedSplits = useMemo(() => {
    const map = new Map<string, Split[]>();
    for (const split of filteredSplits) {
      const label = getDateLabel(split.createdAt);
      const arr = map.get(label) ?? [];
      arr.push(split);
      map.set(label, arr);
    }
    return [...map.entries()];
  }, [filteredSplits]);

  function toggleActions(id: string) {
    setOpenActionsId((prev) => (prev === id ? null : id));
    setShowingReceiveMembersForSplitId(null);
  }

  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
      {/* ─── Split List ─── */}
      {filteredSplits.length === 0 ? (
        <EmptyState
          icon={FiShare2}
          title={filterMode === 'own' ? 'No Own Splits' : 'No Splits Yet'}
          description={
            filterMode === 'own'
              ? 'You don\'t have any splits where you\'re involved.'
              : 'Create a split to track shared expenses with friends, family, or roommates.'
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groupedSplits.map(([label, items], gi) => (
            <div key={label}>
              {/* Date group header */}
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              <div className="flex flex-col gap-2.5">
                {items.map((split, index) => {
                  const showActions = openActionsId === split.id;
                  const myEmail = user?.email?.toLowerCase();
                  const payerEmail = getSplitUserEmail(split.paidBy).toLowerCase();
                  const iAmPayer = myEmail ? payerEmail === myEmail : false;
                  const isClosedOrCompleted = split.status === 'Closed' || split.status === 'Completed';

                  // Calculate paid vs pending count
                  const paidCount = split.members.filter((m) => m.paid).length;
                  const pendingCount = split.members.filter((m) => !m.paid).length;

                  // Calculate my share info for "own" view
                  const myMember = myEmail
                    ? split.members.find(
                        (m) => getSplitUserEmail(m.userId).toLowerCase() === myEmail
                      )
                    : undefined;

                  return (
                    <div key={split.id} className="relative overflow-hidden rounded-[20px]">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(gi * 0.03 + index * 0.025, 0.25),
                          duration: 0.22,
                        }}
                        className={cn(
                          'relative flex items-center gap-3 rounded-2xl border bg-surface p-3 shadow-soft',
                          split.status === 'Closed' ? 'border-rose-500/30 bg-surface/80' : 'border-border'
                        )}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
                            split.status === 'Closed'
                              ? 'bg-rose-500/10 text-rose-500'
                              : iAmPayer
                              ? 'bg-income/10 text-income'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          <FiGitBranch size={18} />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {split.title}
                            </p>
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shrink-0',
                                split.status === 'Closed'
                                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                                  : split.status === 'Completed'
                                  ? 'bg-income/15 text-income'
                                  : split.status === 'Partially Paid'
                                  ? 'bg-primary/15 text-primary'
                                  : split.status === 'Pending'
                                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                  : 'bg-surface-2 text-muted border border-border'
                              )}
                            >
                              {split.status}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-muted">
                            <div className="flex items-center gap-1.5 truncate">
                              <span>{iAmPayer ? 'You paid' : `Paid by ${splitUserName(split.paidBy)}`}</span>
                              <span className="text-muted/60">•</span>
                              <span>{split.members.length} Members</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <span className="text-income">{paidCount} Paid</span>
                              <span className="text-muted/60">•</span>
                              <span className="text-amber-500">{pendingCount} Pending</span>
                            </div>
                            {iAmPayer ? (
                              <div className="flex items-center gap-1 font-bold text-income">
                                <span>✓ You paid</span>
                                <span className="font-normal text-muted/80">({formatPaidDateTime(split.createdAt)})</span>
                              </div>
                            ) : myMember ? (
                              <div className="flex items-center gap-1 font-bold">
                                {myMember.paid ? (
                                  <span className="text-income flex items-center gap-1">
                                    <span>✓ You paid</span>
                                    <span className="font-normal text-muted/80">({formatPaidDateTime(split.updatedAt || split.createdAt)})</span>
                                  </span>
                                ) : (
                                  <span className="text-expense">
                                    You owe {formatCurrency(myMember.shareAmount, currency)}
                                  </span>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>

                  {/* Right Section: Own Amount, Total Amount & Time (top right) + Action buttons (bottom right) */}
                  <div className="flex shrink-0 flex-col items-end justify-between gap-1.5 self-stretch">
                    <div className="flex flex-col items-end gap-0.5">
                      <p className="whitespace-nowrap text-right font-mono text-sm font-bold text-primary">
                        {formatCurrency(myMember ? myMember.shareAmount : split.amount, currency)}
                      </p>
                      <p className="whitespace-nowrap text-right text-[10px] font-medium text-muted">
                        Total {formatCurrency(split.amount, currency)}
                      </p>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-normal text-muted">
                        <FiClock size={11} className="shrink-0 text-muted/70" />
                        {formatTime(split.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewing(split)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                        aria-label="View"
                      >
                        <FiEye size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isClosedOrCompleted}
                        onClick={() => !isClosedOrCompleted && toggleActions(split.id)}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                          isClosedOrCompleted
                            ? 'opacity-30 cursor-not-allowed text-muted'
                            : showActions
                            ? 'bg-surface-2 text-foreground'
                            : 'text-muted hover:bg-surface-2'
                        )}
                        title={isClosedOrCompleted ? 'Actions disabled for closed split' : 'More actions'}
                        aria-label="More actions"
                      >
                        <FiMoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Action tray */}
                <AnimatePresence>
                  {showActions && !isClosedOrCompleted && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {(() => {
                        const pendingMembers = split.members.filter(
                          (m) =>
                            getSplitUserEmail(m.userId).toLowerCase() !== payerEmail && !m.paid
                        );

                        if (iAmPayer) {
                          if (showingReceiveMembersForSplitId === split.id) {
                            return (
                              <div className="flex flex-col gap-1.5 px-1 pb-2 pt-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-1">
                                  Mark who paid:
                                </p>
                                <div className="flex flex-wrap gap-1.5 px-1">
                                  {pendingMembers.map((member) => (
                                    <button
                                      key={getSplitUserId(member.userId)}
                                      type="button"
                                      onClick={() => {
                                        setConfirmReceive({ split, member });
                                        setShowingReceiveMembersForSplitId(null);
                                        setOpenActionsId(null);
                                      }}
                                      className="rounded-xl bg-income/10 px-3 py-2 text-xs font-semibold text-income transition hover:bg-income hover:text-income-foreground"
                                    >
                                      {splitUserName(member.userId)}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setShowingReceiveMembersForSplitId(null)}
                                    className="rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold text-muted transition hover:text-foreground"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-3 gap-2 px-1 pb-1 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmRemind(split);
                                  setOpenActionsId(null);
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-2 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                              >
                                <FiBell size={12} /> Remind
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (pendingMembers.length === 1) {
                                    setConfirmReceive({ split, member: pendingMembers[0] });
                                    setOpenActionsId(null);
                                  } else {
                                    setShowingReceiveMembersForSplitId(split.id);
                                  }
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-income/10 px-2 py-2.5 text-xs font-semibold text-income transition hover:bg-income hover:text-income-foreground"
                              >
                                <FiCheckSquare size={12} /> Receive
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmClose(split);
                                  setCloseReasonInput('');
                                  setOpenActionsId(null);
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-expense/10 px-2 py-2.5 text-xs font-semibold text-expense transition hover:bg-expense hover:text-expense-foreground"
                              >
                                <FiXCircle size={12} /> Close
                              </button>
                            </div>
                          );
                        }

                        // For receiver user who owes money
                        if (myMember && !myMember.paid) {
                          return (
                            <div className="px-1 pb-1 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmPaidSelf({ split, member: myMember });
                                  setOpenActionsId(null);
                                }}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-income/10 px-2 py-2.5 text-xs font-semibold text-income transition hover:bg-income hover:text-income-foreground"
                              >
                                <FiCheckSquare size={12} /> I Paid
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="px-2 py-2.5 text-center text-xs text-muted">
                            All settled!
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
)}

      {/* Close Split Modal with Reason TextArea */}
      <AnimatePresence>
        {confirmClose && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setConfirmClose(null);
                setCloseReasonInput('');
              }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                role="alertdialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="pointer-events-auto w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-soft"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-expense/10 text-expense">
                  <FiXCircle size={22} />
                </div>
                <h2 className="mb-1 text-lg font-display font-semibold">
                  Close &quot;{confirmClose.title}&quot;?
                </h2>
                <p className="mb-4 text-xs text-muted">
                  Closing this split will set its status to Closed and disable further actions. All members will be notified.
                </p>

                <div className="mb-5 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">
                    Reason for Closing
                  </label>
                  <textarea
                    rows={3}
                    value={closeReasonInput}
                    onChange={(e) => setCloseReasonInput(e.target.value)}
                    placeholder="Enter reason for closing (e.g. Settled offline, Cancelled)..."
                    className="w-full rounded-xl border border-border bg-surface-2 p-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmClose(null);
                      setCloseReasonInput('');
                    }}
                    className="flex-1 rounded-xl border border-border bg-surface-2 py-2.5 text-xs font-semibold text-foreground transition hover:bg-surface-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteSplit.isPending}
                    onClick={() => {
                      deleteSplit.mutate(
                        { id: confirmClose.id, reason: closeReasonInput },
                        {
                          onSuccess: () => {
                            setConfirmClose(null);
                            setCloseReasonInput('');
                          },
                        }
                      );
                    }}
                    className="flex-1 rounded-xl bg-expense py-2.5 text-xs font-semibold text-expense-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {deleteSplit.isPending ? 'Closing...' : 'Close Split'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <BottomSheet
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit split"
        showHeader={false}
        className="h-[100dvh] max-h-[100dvh] rounded-none border-0 bg-surface p-0 sm:h-[92vh] sm:max-w-[430px] sm:rounded-2xl sm:border sm:p-0"
      >
        {editing && (
          <div className="flex h-full min-h-0 flex-col bg-surface text-foreground">
            {/* Header bar */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:h-[74px] sm:px-5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="grid h-10 w-10 shrink-0 place-items-center text-foreground sm:h-11 sm:w-11"
                aria-label="Back"
              >
                <FiArrowLeft size={28} strokeWidth={2.2} />
              </button>
              <h2 className="min-w-0 flex-1 truncate px-2 text-center text-xl font-semibold leading-tight tracking-normal sm:px-4 sm:text-[28px] text-primary">
                Edit Split
              </h2>
              <div className="w-10 sm:w-11" />
            </div>

            <div className="flex-1 min-h-0">
              <SplitModal split={editing} onClose={() => setEditing(null)} />
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="Split Details"
        showHeader={false}
        className="h-[100dvh] max-h-[100dvh] rounded-none border-0 bg-surface p-0 sm:h-[92vh] sm:max-w-[430px] sm:rounded-2xl sm:border sm:p-0"
      >
        {viewing && (
          <div className="flex h-full min-h-0 flex-col bg-surface text-foreground">
            {/* Header bar */}
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

            {/* Render SplitModal directly (it handles its own layout and scrolling) */}
            <div className="flex-1 min-h-0">
              <SplitModal
                split={viewing}
                readOnly={true}
                onClose={() => setViewing(null)}
                onEdit={() => {
                  setViewing(null);
                  setEditing(viewing);
                }}
              />
            </div>
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        isOpen={!!confirmRemind}
        title="Send Reminder?"
        description={`Send a system reminder notification to pending members of "${confirmRemind?.title}"?`}
        confirmLabel="Send"
        isDangerous={false}
        isLoading={sendSplitReminder.isPending}
        onConfirm={() => {
          if (confirmRemind) {
            sendSplitReminder.mutate(confirmRemind.id, {
              onSuccess: () => setConfirmRemind(null),
            });
          }
        }}
        onCancel={() => setConfirmRemind(null)}
      />

      <ConfirmDialog
        isOpen={!!confirmReceive}
        title="Mark as Paid?"
        description={
          confirmReceive
            ? `Are you sure you want to mark ${splitUserName(confirmReceive.member.userId)} as paid?`
            : ''
        }
        confirmLabel="Confirm"
        isDangerous={false}
        isLoading={markSplitPaid.isPending}
        onConfirm={() => {
          if (confirmReceive) {
            markSplitPaid.mutate(
              { splitId: confirmReceive.split.id, memberId: getSplitUserId(confirmReceive.member.userId) },
              {
                onSuccess: () => setConfirmReceive(null),
              }
            );
          }
        }}
        onCancel={() => setConfirmReceive(null)}
      />

      <ConfirmDialog
        isOpen={!!confirmPaidSelf}
        title="Mark as Paid?"
        description={`Are you sure you want to mark your share of "${confirmPaidSelf?.split.title}" as paid?`}
        confirmLabel="Confirm"
        isDangerous={false}
        isLoading={markSplitPaid.isPending}
        onConfirm={() => {
          if (confirmPaidSelf) {
            markSplitPaid.mutate(
              { splitId: confirmPaidSelf.split.id, memberId: getSplitUserId(confirmPaidSelf.member.userId) },
              {
                onSuccess: () => setConfirmPaidSelf(null),
              }
            );
          }
        }}
        onCancel={() => setConfirmPaidSelf(null)}
      />
    </>
  );
}
