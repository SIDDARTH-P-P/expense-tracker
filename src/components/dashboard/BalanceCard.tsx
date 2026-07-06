'use client';

import { motion } from 'framer-motion';
import { FiArrowDownLeft, FiArrowUpRight, FiCreditCard, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { formatPercent } from '@/lib/utils/format';

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeChangePct: number;
  expenseChangePct: number;
  currency: string;
}

export function BalanceCard({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  incomeChangePct,
  expenseChangePct,
  currency,
}: BalanceCardProps) {
  const isPositive = totalBalance >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl shadow-glow"
      style={{
        background: 'linear-gradient(135deg, hsl(172 66% 34%) 0%, hsl(172 66% 42%) 40%, hsl(152 60% 44%) 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-black/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative px-6 py-6 text-white">
        {/* Top row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/15">
              <FiCreditCard size={14} />
            </div>
            <p className="text-sm font-medium opacity-90">Total Balance</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            {isPositive ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
            <span>{isPositive ? 'Positive' : 'Negative'}</span>
          </div>
        </div>

        {/* Balance */}
        <div className="mt-2 mb-6">
          <div className="font-display text-4xl font-extrabold tracking-tight">
            <AnimatedNumber value={totalBalance} currency={currency} />
          </div>
          <p className="text-xs opacity-70 mt-1">Overall net position</p>
        </div>

        {/* Income / Expense row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/12 backdrop-blur-sm p-4 border border-white/10">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <FiArrowDownLeft size={11} />
              </div>
              <p className="text-xs opacity-80 font-medium">Income</p>
            </div>
            <p className="amount text-lg font-bold">
              <AnimatedNumber value={monthlyIncome} currency={currency} />
            </p>
            <p className="mt-1 text-[11px] opacity-70 flex items-center gap-0.5">
              <FiTrendingUp size={10} />
              {formatPercent(incomeChangePct)} vs last month
            </p>
          </div>

          <div className="rounded-2xl bg-white/12 backdrop-blur-sm p-4 border border-white/10">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <FiArrowUpRight size={11} />
              </div>
              <p className="text-xs opacity-80 font-medium">Expense</p>
            </div>
            <p className="amount text-lg font-bold">
              <AnimatedNumber value={monthlyExpense} currency={currency} />
            </p>
            <p className="mt-1 text-[11px] opacity-70 flex items-center gap-0.5">
              <FiTrendingDown size={10} />
              {formatPercent(expenseChangePct)} vs last month
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
