'use client';

import { FiTrendingUp, FiTrendingDown, FiPieChart, FiCalendar } from 'react-icons/fi';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useCurrentUser } from '@/hooks/useAuth';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TopCategories } from '@/components/dashboard/TopCategories';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { IncomeExpenseBarChart } from '@/components/charts/IncomeExpenseBarChart';
import { CardSkeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency } from '@/lib/utils/format';

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary();
  const currency = user?.currency ?? 'USD';

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (isLoading || !summary) {
    return (
      <div className="mx-auto max-w-3xl flex flex-col gap-4">
        <CardSkeleton className="h-52" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28 hidden sm:block" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-64" />
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-5">
      {/* Hero balance card */}
      <BalanceCard
        totalBalance={summary.totalBalance}
        monthlyIncome={summary.monthlyIncome}
        monthlyExpense={summary.monthlyExpense}
        incomeChangePct={summary.incomeChangePct}
        expenseChangePct={summary.expenseChangePct}
        currency={currency}
      />

      {/* Month label */}
      <div className="flex items-center gap-2 text-xs text-muted font-semibold uppercase tracking-widest">
        <FiCalendar size={12} />
        <span>{currentMonth}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Savings"
          value={summary.monthlySavings}
          currency={currency}
          icon={FiTrendingUp}
          tone="income"
          sublabel="This month"
          delay={0.05}
        />
        <StatCard
          label="Today's spend"
          value={summary.todaySpending}
          currency={currency}
          icon={FiTrendingDown}
          tone="expense"
          sublabel="vs yesterday"
          delay={0.1}
        />
        <StatCard
          label="Top category"
          value={summary.topCategories[0]?.total ?? 0}
          currency={currency}
          icon={FiPieChart}
          tone="primary"
          sublabel={summary.topCategories[0]?.category.name ?? 'N/A'}
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyTrendChart data={summary.monthlyTrend} currency={currency} />
        <IncomeExpenseBarChart data={summary.monthlyTrend} currency={currency} />
      </div>

      {/* Bottom: Recent + Top categories */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentTransactions transactions={summary.recentTransactions} currency={currency} />
        <TopCategories categories={summary.topCategories} currency={currency} />
      </div>
    </div>
  );
}
