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
} from 'react-icons/fi';
import { BottomSheet } from '@/components/common/BottomSheet';
import { EmptyState } from '@/components/common/EmptyState';
import { DeleteDialog } from '@/components/management/DeleteDialog';
import { LoadingSkeleton } from '@/components/management/LoadingSkeleton';
import { SplitModal } from '@/components/management/SplitModal';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDeleteSplit, useSplits, useMarkSplitPaid, useSplitUsers } from '@/hooks/useManagement';
import { formatCurrency } from '@/lib/utils/format';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils/cn';
import type { Split, SplitUser } from '@/types';

interface SplitListProps {
  search?: string;
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

export function SplitList({ search }: SplitListProps) {
  const filterMode = useUIStore((s) => s.splitFilterMode);
  const { data: user } = useCurrentUser();
  const { data: splits = [], isLoading } = useSplits(search);
  const { data: splitUsers = [] } = useSplitUsers();
  const deleteSplit = useDeleteSplit();
  const markSplitPaid = useMarkSplitPaid();
  const [viewing, setViewing] = useState<Split | null>(null);
  const [editing, setEditing] = useState<Split | null>(null);
  const [deleting, setDeleting] = useState<Split | null>(null);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const currency = user?.currency ?? 'INR';


  // Filter splits based on mode
  const filteredSplits = useMemo(() => {
    const myEmail = user?.email?.toLowerCase();
    if (!myEmail) return [];
    return splits.filter((split) => {
      const isPayer = getSplitUserEmail(split.paidBy).toLowerCase() === myEmail;
      const isMember = split.members.some(
        (m) => getSplitUserEmail(m.userId).toLowerCase() === myEmail
      );
      // Own mode: show ONLY splits paid by me (i put split)
      if (filterMode === 'own') {
        return isPayer;
      }
      // All mode: show splits paid by me (i put split) AND splits against me (isMember)
      return isPayer || isMember;
    });
  }, [splits, filterMode, user]);

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

      if (split.status === 'Completed') {
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

  function toggleActions(id: string) {
    setOpenActionsId((prev) => (prev === id ? null : id));
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
        <div className="flex flex-col gap-2.5">
          {filteredSplits.map((split, index) => {
            const showActions = openActionsId === split.id;
            const myEmail = user?.email?.toLowerCase();
            const payerEmail = getSplitUserEmail(split.paidBy).toLowerCase();
            const iAmPayer = myEmail ? payerEmail === myEmail : false;

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
                    delay: Math.min(index * 0.025, 0.2),
                    duration: 0.22,
                  }}
                  className="relative flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-2xl',
                      iAmPayer
                        ? 'bg-income/10 text-income'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    <FiGitBranch size={18} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {split.title}
                        </p>
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shrink-0',
                            split.status === 'Completed'
                              ? 'bg-income/15 text-income'
                              : split.status === 'Partially Paid'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-surface-2 text-muted border border-border'
                          )}
                        >
                          {split.status}
                        </span>
                      </div>
                      <p className="shrink-0 font-mono text-sm font-bold text-primary">
                        {formatCurrency(split.amount, currency)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted">
                      <span>
                        {iAmPayer ? 'You paid' : `Paid by ${splitUserName(split.paidBy)}`}
                      </span>
                      <span>·</span>
                      <span>{split.members.length} Members</span>
                      <span>·</span>
                      <span>
                        {split.splitMode === 'equal' ? 'Equal' : 'Custom'}
                      </span>
                    </div>

                    {/* My share line (Google Pay style) */}
                    {myMember && !iAmPayer && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            myMember.paid ? 'text-income' : 'text-expense'
                          )}
                        >
                          {myMember.paid
                            ? '✓ You paid'
                            : `You owe ${formatCurrency(myMember.shareAmount, currency)}`}
                        </span>
                      </div>
                    )}

                    {iAmPayer && split.status !== 'Completed' && (
                      <div className="mt-1">
                        <span className="text-xs font-semibold text-income">
                          {
                            split.members.filter(
                              (m) =>
                                getSplitUserEmail(m.userId).toLowerCase() !== payerEmail && !m.paid
                            ).length
                          }{' '}
                          pending
                        </span>
                      </div>
                    )}

                    <p className="mt-0.5 font-mono text-[11px] text-primary">
                      {split.recordId}
                    </p>
                  </div>

                  {/* Right: view + three-dot */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewing(split)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                      aria-label="View"
                    >
                      <FiEye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActions(split.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                        showActions
                          ? 'bg-surface-2 text-foreground'
                          : 'text-muted hover:bg-surface-2'
                      }`}
                      aria-label="More actions"
                    >
                      <FiMoreVertical size={14} />
                    </button>
                  </div>
                </motion.div>

                {/* Action tray */}
                <AnimatePresence>
                  {showActions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 px-1 pb-1 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(split);
                            setOpenActionsId(null);
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-2 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                        >
                          <FiEdit2 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleting(split);
                            setOpenActionsId(null);
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-expense/10 px-2 py-2.5 text-xs font-semibold text-expense transition hover:bg-expense hover:text-expense-foreground"
                        >
                          <FiTrash2 size={12} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* View detail sheet */}
      <BottomSheet
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="Split details"
      >
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Record ID
              </p>
              <p className="font-mono text-sm font-semibold text-primary">
                {viewing.recordId}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Title</p>
              <p className="text-lg font-semibold">{viewing.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface p-3">
                <p className="text-xs text-muted">Amount</p>
                <p className="font-mono font-bold text-primary">
                  {formatCurrency(viewing.amount, currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-3">
                <p className="text-xs text-muted">Paid by</p>
                <p className="truncate font-semibold">
                  {splitUserName(viewing.paidBy)}
                </p>
              </div>
            </div>

            {(() => {
              const payerId = getSplitUserId(viewing.paidBy);
              const nonPayers = viewing.members.filter(
                (m) => getSplitUserId(m.userId) !== payerId
              );
              const paidNonPayers = nonPayers.filter((m) => m.paid);
              const totalNonPayers = nonPayers.length;
              const paidCount = paidNonPayers.length;
              const progressPercent =
                totalNonPayers > 0
                  ? (paidCount / totalNonPayers) * 100
                  : 100;

              return (
                <>
                  {/* Progress section */}
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted">Settlement Progress</span>
                      <span className="text-primary font-mono">
                        {paidCount} of {totalNonPayers} Paid
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-muted">
                      Members Share
                    </p>
                    {viewing.members.map((member) => {
                      const memberId = getSplitUserId(member.userId);
                      const isPayer = memberId === payerId;
                      const memberEmail =
                        typeof member.userId === 'string'
                          ? ''
                          : member.userId.email;
                      const isMe =
                        user?.email?.toLowerCase() ===
                        memberEmail.toLowerCase();

                      // Can mark paid if it's the logged-in user themselves, they are not the payer, and they haven't paid yet
                      const canMarkPaid = isMe && !isPayer && !member.paid;

                      return (
                        <div
                          key={memberId}
                          className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold">
                                {splitUserName(member.userId)}
                              </p>
                              {isPayer && (
                                <span className="rounded-full bg-primary/10 px-1 py-0.5 text-[8px] font-bold uppercase text-primary">
                                  Payer
                                </span>
                              )}
                              {isMe && (
                                <span className="rounded-full bg-primary/15 px-1 py-0.5 text-[8px] font-bold uppercase text-primary">
                                  You
                                </span>
                              )}
                            </span>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span
                                className={cn(
                                  'rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide',
                                  member.paid
                                    ? 'bg-income/10 text-income'
                                    : 'bg-surface-2 text-muted border border-border'
                                )}
                              >
                                {member.paid ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className="font-mono text-sm font-semibold">
                              {formatCurrency(member.shareAmount, currency)}
                            </p>
                            {canMarkPaid && (
                              <button
                                type="button"
                                disabled={markSplitPaid.isPending}
                                onClick={() => {
                                  markSplitPaid.mutate(
                                    { splitId: viewing.id, memberId },
                                    {
                                      onSuccess: (updatedSplit) => {
                                        setViewing(updatedSplit);
                                      },
                                    }
                                  );
                                }}
                                className="rounded-xl bg-income px-3 py-1.5 text-xs font-bold text-income-foreground hover:opacity-90 transition disabled:opacity-50"
                              >
                                {markSplitPaid.isPending
                                  ? 'Saving...'
                                  : 'Mark Paid'}
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
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit split"
      >
        <SplitModal split={editing} onClose={() => setEditing(null)} />
      </BottomSheet>

      <DeleteDialog
        isOpen={!!deleting}
        title={`Delete "${deleting?.title}"?`}
        description={`${deleting?.recordId ?? 'This split'} will be permanently removed.`}
        isLoading={deleteSplit.isPending}
        onConfirm={() =>
          deleting &&
          deleteSplit.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
          })
        }
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
