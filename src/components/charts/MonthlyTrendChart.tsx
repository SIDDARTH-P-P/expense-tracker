'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface MonthlyTrendChartProps {
  data: { month: string; income: number; expense: number }[];
  currency: string;
}

export function MonthlyTrendChart({ data, currency }: MonthlyTrendChartProps) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <h3 className="mb-4 font-display text-base font-semibold">Monthly trend</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152 60% 42%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(152 60% 42%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(350 75% 56%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(350 75% 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area type="monotone" dataKey="income" stroke="hsl(152 60% 42%)" fill="url(#incomeGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="expense" stroke="hsl(350 75% 56%)" fill="url(#expenseGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
