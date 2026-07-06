'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/format';
import { EmptyState } from '@/components/common/EmptyState';
import { FiPieChart } from 'react-icons/fi';
import type { Category } from '@/types';

interface TopCategoriesProps {
  categories: { category: Category; total: number; percent: number }[];
  currency: string;
}

export function TopCategories({ categories, currency }: TopCategoriesProps) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
      <h3 className="mb-5 font-display text-base font-semibold">Top Spending</h3>

      {categories.length === 0 ? (
        <EmptyState
          icon={FiPieChart}
          title="Nothing to show"
          description="Your top spending categories appear once you add expenses."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map(({ category, total, percent }, i) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-sm"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    <span style={{ fontSize: 14 }}>•</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{category.name}</p>
                    <p className="text-[11px] text-muted">{Math.round(percent)}% of spending</p>
                  </div>
                </div>
                <span className="amount text-sm font-bold text-expense">
                  {formatCurrency(total, currency)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: category.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percent, 100)}%` }}
                  transition={{ delay: i * 0.07 + 0.2, duration: 0.7, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
