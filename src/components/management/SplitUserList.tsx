'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { Avatar } from '@/components/common/Avatar';
import { BottomSheet } from '@/components/common/BottomSheet';
import { EmptyState } from '@/components/common/EmptyState';
import { DeleteDialog } from '@/components/management/DeleteDialog';
import { LoadingSkeleton } from '@/components/management/LoadingSkeleton';
import { SplitUserModal } from '@/components/management/SplitUserModal';
import { useDeleteSplitUser, useSplitUsers } from '@/hooks/useManagement';
import type { SplitUser } from '@/types';

interface SplitUserListProps {
  search?: string;
}

export function SplitUserList({ search }: SplitUserListProps) {
  const { data: splitUsers = [], isLoading } = useSplitUsers(search);
  const deleteSplitUser = useDeleteSplitUser();
  const [editing, setEditing] = useState<SplitUser | null>(null);
  const [deleting, setDeleting] = useState<SplitUser | null>(null);

  if (isLoading) return <LoadingSkeleton />;

  if (splitUsers.length === 0) {
    return (
      <EmptyState
        icon={FiUserPlus}
        title="No Split Users Yet"
        description="Add people you commonly split bills with."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {splitUsers.map((splitUser, index) => (
          <motion.div
            key={splitUser.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.22 }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
          >
            <Avatar name={splitUser.name} size={44} className="shrink-0 ring-2 ring-primary/20" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{splitUser.name}</p>
              <p className="truncate text-xs text-muted">{splitUser.email}</p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-primary">{splitUser.recordId}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(splitUser)}
                aria-label={`Edit ${splitUser.name}`}
                className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted transition hover:text-primary"
              >
                <FiEdit2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(splitUser)}
                aria-label={`Delete ${splitUser.name}`}
                className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted transition hover:text-expense"
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title="Edit split user">
        <SplitUserModal splitUser={editing} onClose={() => setEditing(null)} />
      </BottomSheet>

      <DeleteDialog
        isOpen={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description={`${deleting?.recordId ?? 'This split user'} will be removed from future split selection.`}
        isLoading={deleteSplitUser.isPending}
        onConfirm={() => deleting && deleteSplitUser.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
