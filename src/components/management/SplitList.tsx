'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiGitBranch, FiShare2, FiTrash2, FiEdit2 } from 'react-icons/fi';
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
  const currency = user?.currency ?? 'INR';

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
        {splits.map((split, index) => (
          <motion.div
            key={split.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.22 }}
            className="rounded-2xl border border-border bg-surface p-3 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <FiGitBranch size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-semibold">{split.title}</p>
                  <p className="shrink-0 font-mono text-sm font-bold text-primary">{formatCurrency(split.amount, currency)}</p>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted">
                  <span>Paid by {splitUserName(split.paidBy)}</span>
                  <span>{split.members.length} Members</span>
                  <span>{split.splitMode === 'equal' ? 'Split Equally' : 'Custom Split'}</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-primary">{split.recordId}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setViewing(split)}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-surface-2 text-xs font-semibold text-muted transition hover:text-primary"
              >
                <FiEye size={13} /> View
              </button>
              <button
                type="button"
                onClick={() => setEditing(split)}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                <FiEdit2 size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleting(split)}
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-expense/10 text-xs font-semibold text-expense transition hover:bg-expense hover:text-expense-foreground"
              >
                <FiTrash2 size={13} /> Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

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
                <div key={typeof member.userId === 'string' ? member.userId : member.userId.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3">
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
