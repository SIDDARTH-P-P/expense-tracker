'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { EmptyState } from '@/components/common/EmptyState';
import { FiPieChart } from 'react-icons/fi';
import type { Category } from '@/types';

interface CategoryPieChartProps {
  data: { category: Category; total: number }[];
  currency: string;
}

export function CategoryPieChart({ data, currency }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-display text-base font-semibold">Expense breakdown</h3>
        <EmptyState icon={FiPieChart} title="No expenses yet" description="Add expenses to see your category breakdown." />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <h3 className="mb-4 font-display text-base font-semibold">Expense breakdown</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="category.name" innerRadius={60} outerRadius={90} paddingAngle={3}>
              {data.map((entry) => (
                <Cell key={entry.category.id} fill={entry.category.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--surface))',
                fontSize: 12,
              }}
              formatter={(value: number, _name, entry) => [formatCurrency(value, currency), entry.payload.category.name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {data.map(({ category }) => (
          <div key={category.id} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
            {category.name}
          </div>
        ))}
      </div>
    </div>
  );
}
