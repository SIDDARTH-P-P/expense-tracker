'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import {
  FiEdit2, FiGrid, FiTrash2, FiMoreVertical, FiEye,
  FiMapPin, FiTag,
} from 'react-icons/fi';
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

const TYPE_CONFIG = {
  income:  { bg: 'bg-income/10',  text: 'text-income',  label: 'Income'  },
  expense: { bg: 'bg-expense/10', text: 'text-expense', label: 'Expense' },
  both:    { bg: 'bg-warning/10', text: 'text-warning', label: 'Both'    },
};

export function CategoryList({ search }: CategoryListProps) {
  const { data: categories = [], isLoading } = useCategories(search);
  const deleteCategory = useDeleteCategory();
  const [viewing, setViewing]         = useState<Category | null>(null);
  const [editing, setEditing]         = useState<Category | null>(null);
  const [deleting, setDeleting]       = useState<Category | null>(null);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

  function toggleActions(id: string) {
    setOpenActionsId((prev) => (prev === id ? null : id));
  }

  if (isLoading) return <LoadingSkeleton />;

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FiGrid}
        title="No Categories Yet"
        description="Create categories to organize your transactions."
      />
    );
  }

  const filteredCategories = search?.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {filteredCategories.map((category, index) => {
          const Icon = (Icons[category.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
          const showActions = openActionsId === category.id;
          const t = TYPE_CONFIG[category.type] ?? TYPE_CONFIG.expense;
          const hasSubs = category.subcategories && category.subcategories.length > 0;

          return (
            <div key={category.id} className="relative overflow-hidden rounded-[20px]">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.025, 0.2), duration: 0.22 }}
                className="relative flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
              >
                {/* Icon */}
                <div
                  className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                  style={{ backgroundColor: `${category.color}1A`, color: category.color }}
                >
                  <Icon size={18} />
                  {/* Sub-count badge */}
                  {hasSubs && (
                    <span
                      className="absolute -bottom-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.subcategories.length}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold">{category.name}</p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-[2px] text-[9px] font-bold uppercase tracking-wide',
                        t.bg, t.text
                      )}
                    >
                      {t.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="font-mono text-[11px] text-primary">{category.recordId}</p>
                    {hasSubs && (
                      <span className="text-[10px] text-muted">
                        · {category.subcategories.length} place{category.subcategories.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: eye + three-dot */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewing(category)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                    aria-label="View category"
                  >
                    <FiEye size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActions(category.id)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      showActions ? 'bg-surface-2 text-foreground' : 'text-muted hover:bg-surface-2'
                    }`}
                    aria-label="More actions"
                  >
                    <FiMoreVertical size={14} />
                  </button>
                </div>
              </motion.div>

              {/* Action tray — same pattern as SplitList */}
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
                        onClick={() => { setEditing(category); setOpenActionsId(null); }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-2 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                      >
                        <FiEdit2 size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={category.isDefault}
                        onClick={() => { setDeleting(category); setOpenActionsId(null); }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-expense/10 px-2 py-2.5 text-xs font-semibold text-expense transition hover:bg-expense hover:text-expense-foreground disabled:cursor-not-allowed disabled:opacity-30"
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

      {/* ── View detail sheet ── */}
      <BottomSheet isOpen={!!viewing} onClose={() => setViewing(null)} title="Category details">
        {viewing && (
          <div className="flex flex-col gap-4">
            {/* Header identity card */}
            <div
              className="flex items-center gap-4 rounded-2xl p-4"
              style={{ backgroundColor: `${viewing.color}14`, border: `1px solid ${viewing.color}30` }}
            >
              {(() => {
                const VIcon = (Icons[viewing.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
                return (
                  <div
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
                    style={{ backgroundColor: `${viewing.color}22`, color: viewing.color }}
                  >
                    <VIcon size={24} />
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-foreground">{viewing.name}</p>
                <p className="font-mono text-xs text-primary">{viewing.recordId}</p>
                <span
                  className={cn(
                    'mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                    TYPE_CONFIG[viewing.type]?.bg, TYPE_CONFIG[viewing.type]?.text
                  )}
                >
                  {TYPE_CONFIG[viewing.type]?.label}
                </span>
              </div>
            </div>

            {/* Color swatch */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-2 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Color</p>
                <p className="font-mono text-sm font-semibold text-foreground">{viewing.color}</p>
              </div>
              <span
                className="h-8 w-8 rounded-full border-2 border-white/10 shadow"
                style={{ backgroundColor: viewing.color }}
              />
            </div>

            {/* Subcategories / Where you pay */}
            {viewing.subcategories && viewing.subcategories.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FiMapPin size={13} className="text-muted" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    Where you pay ({viewing.subcategories.length})
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {viewing.subcategories.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
                      style={{ borderLeftColor: viewing.color, borderLeftWidth: 3 }}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                        style={{ backgroundColor: `${viewing.color}18`, color: viewing.color }}
                      >
                        {idx + 1}
                      </span>
                      <p className="flex-1 truncate text-sm font-semibold text-foreground">{sub.name}</p>
                      <FiTag size={12} className="shrink-0 text-muted" style={{ color: viewing.color }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-6">
                <FiMapPin size={20} className="text-muted" />
                <p className="text-sm font-semibold text-muted">No sub-categories yet</p>
                <p className="text-xs text-muted/70">Tap Edit to add places where you pay</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* ── Edit Sheet ── */}
      <BottomSheet
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit category"
        showHeader={false}
        className="h-[100dvh] max-h-[100dvh] rounded-none border-0 bg-surface p-0 sm:h-[92vh] sm:max-w-[430px] sm:rounded-2xl sm:border sm:p-0"
      >
        <CategoryModal category={editing} onClose={() => setEditing(null)} />
      </BottomSheet>

      {/* ── Delete Dialog ── */}
      <DeleteDialog
        isOpen={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description={`${deleting?.recordId ?? 'This category'} and all its sub-categories will be permanently removed.`}
        isLoading={deleteCategory.isPending}
        onConfirm={() =>
          deleting && deleteCategory.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
