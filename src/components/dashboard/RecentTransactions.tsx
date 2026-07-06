'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { FiInbox, FiArrowRight } from 'react-icons/fi';
import type { Transaction } from '@/types';

function getRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function RecentTransactions({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  // Group by relative date
  const grouped: { label: string; items: Transaction[] }[] = [];
  for (const tx of transactions) {
    const label = getRelativeDate(tx.date);
    const group = grouped.find((g) => g.label === label);
    if (group) group.items.push(tx);
    else grouped.push({ label, items: [tx] });
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Recent Activity</h3>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          See all <FiArrowRight size={12} />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={FiInbox}
          title="No transactions yet"
          description="Add your first income or expense to see it here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(({ label, items }, gi) => (
            <div key={label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
              <div className="flex flex-col gap-2">
                {items.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.06 + i * 0.04, duration: 0.3 }}
                  >
                    <TransactionCard transaction={tx} currency={currency} compact />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
