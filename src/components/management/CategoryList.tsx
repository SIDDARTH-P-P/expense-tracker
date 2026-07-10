'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { FiEdit2, FiGrid, FiTrash2 } from 'react-icons/fi';
import { BottomSheet } from '@/components/common/BottomSheet';
import { EmptyState } from '@/components/common/EmptyState';
import { CategoryModal } from '@/components/management/CategoryModal';
import { DeleteDialog } from '@/components/management/DeleteDialog';
import { LoadingSkeleton } from '@/components/management/LoadingSkeleton';
import { useCategories, useDeleteCategory } from '@/hooks/useCategories';
import { cn } from '@/lib/utils/cn';
import type { Category } from '@/types';

interface CategoryListProps {
  search?: string;
}

export function CategoryList({ search }: CategoryListProps) {
  const { data: categories = [], isLoading } = useCategories(search);
  const deleteCategory = useDeleteCategory();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  if (isLoading) return <LoadingSkeleton />;

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FiGrid}
        title="No Categories Yet"
        description="Create categories to organize transactions and improve search."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {categories.map((category, index) => {
          const Icon = (Icons[category.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.22 }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
            >
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-semibold">{category.name}</p>
                  <span className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                    category.type === 'income'
                      ? 'bg-income/10 text-income'
                      : category.type === 'both'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-expense/10 text-expense'
                  )}>
                    {category.type}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-primary">{category.recordId}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(category)}
                  aria-label={`Edit ${category.name}`}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted transition hover:text-primary"
                >
                  <FiEdit2 size={15} />
                </button>
                <button
                  type="button"
                  disabled={category.isDefault}
                  title={category.isDefault ? 'Default categories are protected' : `Delete ${category.name}`}
                  onClick={() => setDeleting(category)}
                  aria-label={`Delete ${category.name}`}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted transition hover:text-expense disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <BottomSheet
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit category"
        showHeader={false}
        className="h-[100dvh] max-h-[100dvh] rounded-none border-0 bg-surface p-0 sm:h-[92vh] sm:max-w-[430px] sm:rounded-2xl sm:border sm:p-0"
      >
        <CategoryModal category={editing} onClose={() => setEditing(null)} />
      </BottomSheet>

      <DeleteDialog
        isOpen={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description={`${deleting?.recordId ?? 'This category'} will be removed from category management.`}
        isLoading={deleteCategory.isPending}
        onConfirm={() => deleting && deleteCategory.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
