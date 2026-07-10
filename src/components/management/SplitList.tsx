'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiGitBranch, FiShare2, FiTrash2, FiEdit2, FiMoreVertical } from 'react-icons/fi';
import { BottomSheet } from '@/components/common/BottomSheet';
import { EmptyState } from '@/components/common/EmptyState';
import { DeleteDialog } from '@/components/management/DeleteDialog';
import { LoadingSkeleton } from '@/components/management/LoadingSkeleton';
import { SplitModal } from '@/components/management/SplitModal';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDeleteSplit, useSplits } from '@/hooks/useManagement';
import { formatCurrency } from '@/lib/utils/format';
import type { Split, SplitUser } from '@/types';

interface SplitListProps {
  search?: string;
}

function splitUserName(value: SplitUser | string) {
  return typeof value === 'string' ? 'Unknown' : value.name;
}

export function SplitList({ search }: SplitListProps) {
  const { data: user } = useCurrentUser();
  const { data: splits = [], isLoading } = useSplits(search);
  const deleteSplit = useDeleteSplit();
  const [viewing, setViewing] = useState<Split | null>(null);
  const [editing, setEditing] = useState<Split | null>(null);
  const [deleting, setDeleting] = useState<Split | null>(null);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const currency = user?.currency ?? 'INR';

  function toggleActions(id: string) {
    setOpenActionsId((prev) => (prev === id ? null : id));
  }

  if (isLoading) return <LoadingSkeleton />;

  if (splits.length === 0) {
    return (
      <EmptyState
        icon={FiShare2}
        title="No Splits Yet"
        description="Create a split to track shared expenses with friends, family, or roommates."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {splits.map((split, index) => {
          const showActions = openActionsId === split.id;
          return (
            <div key={split.id} className="relative overflow-hidden rounded-[20px]">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.22 }}
                className="relative flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
              >
                {/* Icon */}
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <FiGitBranch size={18} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold">{split.title}</p>
                    <p className="shrink-0 font-mono text-sm font-bold text-primary">
                      {formatCurrency(split.amount, currency)}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted">
                    <span>Paid by {splitUserName(split.paidBy)}</span>
                    <span>·</span>
                    <span>{split.members.length} Members</span>
                    <span>·</span>
                    <span>{split.splitMode === 'equal' ? 'Equal' : 'Custom'}</span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-primary">{split.recordId}</p>
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
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${showActions ? 'bg-surface-2 text-foreground' : 'text-muted hover:bg-surface-2'}`}
                    aria-label="More actions"
                  >
                    <FiMoreVertical size={14} />
                  </button>
                </div>
              </motion.div>

              {/* Action tray — same pattern as TransactionCard */}
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
                        onClick={() => { setEditing(split); setOpenActionsId(null); }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-2 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                      >
                        <FiEdit2 size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeleting(split); setOpenActionsId(null); }}
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

      {/* View detail sheet */}
      <BottomSheet isOpen={!!viewing} onClose={() => setViewing(null)} title="Split details">
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Record ID</p>
              <p className="font-mono text-sm font-semibold text-primary">{viewing.recordId}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Title</p>
              <p className="text-lg font-semibold">{viewing.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface p-3">
                <p className="text-xs text-muted">Amount</p>
                <p className="font-mono font-bold text-primary">{formatCurrency(viewing.amount, currency)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-3">
                <p className="text-xs text-muted">Paid by</p>
                <p className="truncate font-semibold">{splitUserName(viewing.paidBy)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {viewing.members.map((member) => (
                <div
                  key={typeof member.userId === 'string' ? member.userId : member.userId.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{splitUserName(member.userId)}</p>
                    <p className="text-xs text-muted">{member.paid ? 'Paid' : 'Unpaid'}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold">{formatCurrency(member.shareAmount, currency)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title="Edit split">
        <SplitModal split={editing} onClose={() => setEditing(null)} />
      </BottomSheet>

      <DeleteDialog
        isOpen={!!deleting}
        title={`Delete "${deleting?.title}"?`}
        description={`${deleting?.recordId ?? 'This split'} will be permanently removed.`}
        isLoading={deleteSplit.isPending}
        onConfirm={() => deleting && deleteSplit.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
