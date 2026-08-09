'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiPlus, FiX, FiCheck } from 'react-icons/fi';
import { useCreateNotebook } from '@/hooks/useNotebooks';
import type { Notebook } from '@/types';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (notebook: Notebook) => void;
}

export function CreateBookModal({
  isOpen,
  onClose,
  onCreated,
}: CreateBookModalProps) {
  const [name, setName] = useState('');
  const createNotebookMutation = useCreateNotebook();

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    createNotebookMutation.mutate(trimmed, {
      onSuccess: (created) => {
        setName('');
        onCreated?.(created);
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
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
          >
            <FiX size={18} />
          </button>

          {/* Icon Header */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <FiBook size={28} />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">
              Create New Transaction Book
            </h3>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">
              Enter a name for your new ledger book to categorize and track specific transactions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Book Name <span className="text-expense">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                  📘
                </span>
                <input
                  type="text"
                  placeholder="e.g. Travel, Rent, Office..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface-2/40 pl-9 pr-4 py-2.5 text-xs font-medium text-foreground placeholder:text-muted focus:border-primary focus:bg-surface focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-border bg-surface-2 py-2.5 text-xs font-semibold text-muted hover:bg-border/60 hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createNotebookMutation.isPending || !name.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                <FiPlus size={15} />
                {createNotebookMutation.isPending ? 'Creating...' : 'Create Book'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
