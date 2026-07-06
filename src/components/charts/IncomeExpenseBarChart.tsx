'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface IncomeExpenseBarChartProps {
  data: { month: string; income: number; expense: number }[];
  currency: string;
}

export function IncomeExpenseBarChart({ data, currency }: IncomeExpenseBarChartProps) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <h3 className="mb-4 font-display text-base font-semibold">Income vs expense</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--surface))',
                fontSize: 12,
              }}
              formatter={(value: number) => formatCurrency(value, currency)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" name="Income" fill="hsl(152 60% 42%)" radius={[6, 6, 0, 0]} maxBarSize={22} />
            <Bar dataKey="expense" name="Expense" fill="hsl(350 75% 56%)" radius={[6, 6, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
