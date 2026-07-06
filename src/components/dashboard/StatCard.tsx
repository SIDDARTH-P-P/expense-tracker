'use client';

import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  label: string;
  value: number;
  currency: string;
  icon: IconType;
  tone?: 'income' | 'expense' | 'primary';
  sublabel?: string;
  delay?: number;
}

const toneConfig = {
  income: {
    icon: 'bg-income/12 text-income',
    text: 'text-income',
    gradient: 'from-income/10 to-income/5',
    badge: 'bg-income/10 text-income',
  },
  expense: {
    icon: 'bg-expense/12 text-expense',
    text: 'text-expense',
    gradient: 'from-expense/10 to-expense/5',
    badge: 'bg-expense/10 text-expense',
  },
  primary: {
    icon: 'bg-primary/12 text-primary',
    text: 'text-primary',
    gradient: 'from-primary/10 to-primary/5',
    badge: 'bg-primary/10 text-primary',
  },
};

export function StatCard({ label, value, currency, icon: Icon, tone = 'primary', sublabel, delay = 0 }: StatCardProps) {
  const config = toneConfig[tone];
  const isPositive = value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-soft',
      )}
    >
      {/* Background gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none', config.gradient)} />

      <div className="relative">
        <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-2xl', config.icon)}>
          <Icon size={18} />
        </div>

        <p className="text-xs text-muted font-medium leading-tight">{label}</p>

        <p className={cn('amount mt-1.5 text-xl font-bold', config.text)}>
          <AnimatedNumber value={value} currency={currency} />
        </p>

        {sublabel && (
          <p className="mt-1 flex items-center gap-0.5 text-[11px] text-muted">
            {isPositive ? <FiTrendingUp size={10} className="text-income" /> : <FiTrendingDown size={10} className="text-expense" />}
            {sublabel}
          </p>
        )}
      </div>
    </motion.div>
  );
}
