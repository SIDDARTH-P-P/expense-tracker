'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useCurrentUser } from '@/hooks/useAuth';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { CardSkeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useUIStore } from '@/store/ui.store';

export default function DashboardPage() {
  const { data: user } = useCurrentUser();

  // Get date range filter state from Zustand
  const dateFilterType = useUIStore((s) => s.dateFilterType);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const selectedYear = useUIStore((s) => s.selectedYear);

  // Compute from & to date strings based on filters
  const dateParams = useMemo(() => {
    if (dateFilterType === 'all') return { from: undefined, to: undefined };
    if (dateFilterType === 'month') {
      const from = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const to = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { from, to };
    }
    // year
    return {
      from: `${selectedYear}-01-01`,
      to: `${selectedYear}-12-31`,
    };
  }, [dateFilterType, selectedMonth, selectedYear]);

  const { data: summary, isLoading, isError, refetch } = useDashboardSummary(dateParams.from, dateParams.to);
  const currency = user?.currency ?? 'INR';

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (isLoading || !summary) {
    return (
      <div className="mx-auto max-w-xl flex flex-col gap-4 pt-3">
        <CardSkeleton className="h-52 rounded-[26px]" />
        <CardSkeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl flex flex-col gap-3">
      {/* Sticky Top Header Container (Hero Balance Card + Recent Expenses Header) */}
      <div className="sticky top-0 z-30 bg-background pt-3 pb-2 flex flex-col gap-4">
        {/* Hero balance card */}
        <BalanceCard
          totalBalance={summary.totalBalance ?? 0}
          monthlyIncome={summary.monthlyIncome ?? 0}
          monthlyExpense={summary.monthlyExpense ?? 0}
          incomeChangePct={summary.incomeChangePct}
          expenseChangePct={summary.expenseChangePct}
          monthlyTrend={summary.monthlyTrend}
          currency={currency}
        />

        {/* Recent Expenses Header */}
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
            Recent Expenses
          </h3>
          <Link
            href="/transactions"
            className="text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            see all
          </Link>
        </div>
      </div>

      {/* Expense Items List only (Scrolls underneath the sticky header) */}
      <RecentTransactions
        transactions={summary.recentTransactions}
        currency={currency}
        showHeader={false}
      />
    </div>
  );
}

