'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiPlus, FiX } from 'react-icons/fi';
import { useEnsureCurrentMonthNotebook } from '@/hooks/useNotebooks';

interface CreateMonthlyBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthBookName: string;
  onCreated?: () => void;
}

export function CreateMonthlyBookModal({
  isOpen,
  onClose,
  monthBookName,
  onCreated,
}: CreateMonthlyBookModalProps) {
  const ensureBook = useEnsureCurrentMonthNotebook();

  if (!isOpen) return null;

  const handleCreate = () => {
    ensureBook.mutate(undefined, {
      onSuccess: () => {
        onCreated?.();
        onClose();
      },
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <FiX size={18} />
          </button>

          {/* Icon Header */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <FiBook size={28} />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">
              Create Transaction Book?
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              A transaction book for <span className="font-semibold text-primary">{monthBookName}</span> does not exist yet. Would you like to create it now to track all income and expenses for this month?
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-border bg-surface-2 py-2.5 text-xs font-semibold text-muted hover:bg-border/60 hover:text-foreground transition-all"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={ensureBook.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <FiPlus size={15} />
              {ensureBook.isPending ? 'Creating...' : 'Create Book'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
