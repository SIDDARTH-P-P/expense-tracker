'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  isDangerous = true,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-soft"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-expense/10 text-expense">
                <FiAlertTriangle size={22} />
              </div>
              <h2 id="confirm-title" className="mb-1 text-lg font-display font-semibold">
                {title}
              </h2>
              <p className="mb-6 text-sm text-muted">{description}</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  variant={isDangerous ? 'danger' : 'primary'}
                  className="flex-1"
                  onClick={onConfirm}
                  isLoading={isLoading}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
