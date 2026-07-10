'use client';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDialog({ isOpen, title, description, isLoading, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      description={description}
      confirmLabel="Delete"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
