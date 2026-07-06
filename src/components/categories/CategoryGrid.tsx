'use client';

import { useState } from 'react';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { BottomSheet } from '@/components/common/BottomSheet';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { CardSkeleton } from '@/components/common/Skeleton';
import type { Category } from '@/types';

export function CategoryGrid() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat) => {
          const Icon = (Icons[cat.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
          return (
            <motion.div
              key={cat.id}
              whileHover={{ y: -2 }}
              className="group relative rounded-2xl border border-border bg-surface p-4"
            >
              <div
                className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
              >
                <Icon size={18} />
              </div>
              <p className="truncate text-sm font-medium">{cat.name}</p>
              <p className="text-xs capitalize text-muted">{cat.type}</p>

              {!cat.isDefault && (
                <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                  <button
                    onClick={() => setEditing(cat)}
                    aria-label={`Edit ${cat.name}`}
                    className="rounded-lg bg-surface-2 p-1.5 text-muted hover:text-foreground"
                  >
                    <FiEdit2 size={12} />
                  </button>
                  <button
                    onClick={() => setDeleting(cat)}
                    aria-label={`Delete ${cat.name}`}
                    className="rounded-lg bg-surface-2 p-1.5 text-muted hover:text-expense"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        <button
          onClick={() => setShowCreate(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-muted transition-colors hover:border-primary hover:text-primary"
        >
          <FiPlus size={20} />
          <span className="text-xs font-medium">New category</span>
        </button>
      </div>

      <BottomSheet isOpen={showCreate} onClose={() => setShowCreate(false)} title="New category">
        <CategoryForm
          isSubmitting={createCategory.isPending}
          onSubmit={(values) => createCategory.mutate(values, { onSuccess: () => setShowCreate(false) })}
        />
      </BottomSheet>

      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title="Edit category">
        {editing && (
          <CategoryForm
            initialData={editing}
            isSubmitting={updateCategory.isPending}
            onSubmit={(values) =>
              updateCategory.mutate({ id: editing.id, input: values }, { onSuccess: () => setEditing(null) })
            }
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        isOpen={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="Transactions in this category will keep their history but won't be re-assignable to it."
        confirmLabel="Delete"
        isLoading={deleteCategory.isPending}
        onConfirm={() => deleting && deleteCategory.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
