'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowDown, FiArrowUp } from 'react-icons/fi';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { formatCurrency } from '@/lib/utils/format';

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeChangePct?: number;
  expenseChangePct?: number;
  monthlyTrend?: { month: string; income: number; expense: number }[];
  currency: string;
}

const DEFAULT_MONTHS = [
  { month: 'Aug', expense: 1120 },
  { month: 'Sep', expense: 1450 },
  { month: 'Oct', expense: 980 },
  { month: 'Nov', expense: 2100 },
  { month: 'Dec', expense: 1650 },
  { month: 'Jan', expense: 890 },
  { month: 'Feb', expense: 1780 },
  { month: 'Mar', expense: 1950 },
  { month: 'Apr', expense: 1884 },
];

export function BalanceCard({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  monthlyTrend,
  currency,
}: BalanceCardProps) {
  const [showChart, setShowChart] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Compute chart data dynamically
  const chartData = useMemo(() => {
    if (monthlyTrend && monthlyTrend.length > 0) {
      const maxExp = Math.max(...monthlyTrend.map((m) => m.expense || 1), 1);
      return monthlyTrend.map((m) => ({
        label: m.month,
        expense: m.expense,
        heightPct: Math.max(15, Math.min(100, Math.round((m.expense / maxExp) * 100))),
      }));
    }

    const maxExp = Math.max(...DEFAULT_MONTHS.map((m) => m.expense));
    return DEFAULT_MONTHS.map((m) => ({
      label: m.month,
      expense: m.expense,
      heightPct: Math.max(15, Math.min(100, Math.round((m.expense / maxExp) * 100))),
    }));
  }, [monthlyTrend]);

  // Selected month amount (or active month amount)
  const activeIdx = selectedIndex !== null ? selectedIndex : chartData.length - 1;
  const currentChartAmount = chartData[activeIdx]?.expense ?? monthlyExpense;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[26px] p-5 sm:p-6 text-white shadow-2xl backdrop-blur-xl border border-white/20 dark:border-white/15 h-[210px] flex flex-col justify-between"
      style={{
        background: 'linear-gradient(135deg, hsl(172, 65%, 34%) 0%, hsl(175, 75%, 22%) 55%, hsl(180, 80%, 14%) 100%)',
      }}
    >
      {/* Glossy top specular reflection overlay */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 via-white/5 to-transparent pointer-events-none" />

      {/* Decorative background glow blobs matching primary theme */}
      <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-teal-300/20 blur-3xl pointer-events-none" />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top row: Title + Clean Switch (No text) */}
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium tracking-wide text-white/90">
            {showChart ? `Outcome (${chartData[activeIdx]?.label ?? 'Month'})` : 'Total Balance'}
          </span>

          {/* Clean Mini Switch Button (No Text) */}
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            aria-label="Toggle chart view"
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border p-0.5 backdrop-blur-md transition-colors duration-200 ease-in-out focus:outline-none ${
              showChart
                ? 'bg-emerald-500/30 border-emerald-400/50'
                : 'bg-white/15 border-white/35 hover:bg-white/25'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                showChart ? 'translate-x-4 bg-emerald-400' : 'translate-x-0 bg-white'
              }`}
            />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showChart ? (
            /* Standard Card View */
            <motion.div
              key="card-view"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-between flex-1 pt-2"
            >
              {/* Main Balance Display */}
              <div>
                <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  <AnimatedNumber value={totalBalance} currency={currency} />
                </div>
              </div>

              {/* Income & Expense sub-cards / pills */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Income Pill */}
                <div className="flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 border border-white/20 shadow-inner overflow-hidden">
                  <div className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-300 shadow-xs border border-emerald-400/20">
                    <FiArrowDown size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-medium text-white/80 leading-none">Income</p>
                    <p className="amount whitespace-nowrap text-xs sm:text-sm font-bold text-white leading-tight mt-0.5">
                      <AnimatedNumber value={monthlyIncome} currency={currency} />
                    </p>
                  </div>
                </div>

                {/* Expense Pill */}
                <div className="flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 border border-white/20 shadow-inner overflow-hidden">
                  <div className="flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-rose-500/30 text-rose-300 shadow-xs border border-rose-400/20">
                    <FiArrowUp size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-medium text-white/80 leading-none">Expenses</p>
                    <p className="amount whitespace-nowrap text-xs sm:text-sm font-bold text-white leading-tight mt-0.5">
                      <AnimatedNumber value={monthlyExpense} currency={currency} />
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Interactive Bar Chart View */
            <motion.div
              key="chart-view"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-between flex-1 pt-1"
            >
              {/* Outcome Main Display */}
              <div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  {formatCurrency(currentChartAmount, currency)}
                </div>
              </div>

              {/* Monthly Bar Chart */}
              <div className="flex flex-col gap-1">
                <div className="flex items-end justify-between h-20 gap-1.5 px-0.5">
                  {chartData.map((item, idx) => {
                    const isActive = idx === activeIdx;
                    return (
                      <div
                        key={item.label + idx}
                        onClick={() => setSelectedIndex(idx)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className="flex flex-col items-center flex-1 h-full justify-end cursor-pointer group"
                        title={`${item.label}: ${formatCurrency(item.expense, currency)}`}
                      >
                        {/* Bar capsule */}
                        <div
                          className="w-full rounded-t-xl rounded-b-xs transition-all duration-250 group-hover:opacity-100"
                          style={{
                            height: `${item.heightPct}%`,
                            backgroundColor: isActive ? '#34D399' : 'rgba(255, 255, 255, 0.25)',
                            boxShadow: isActive ? '0 4px 14px rgba(52, 211, 153, 0.5)' : undefined,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Month labels at bottom */}
                <div className="flex justify-between px-0.5 text-[10px] sm:text-[11px] font-medium text-white/75">
                  {chartData.map((item, idx) => (
                    <span
                      key={item.label + idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        idx === activeIdx ? 'text-emerald-300 font-bold' : 'hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

