'use client';

import { useCurrentUser } from '@/hooks/useAuth';
import { useSplits } from '@/hooks/useManagement';
import { formatCurrency } from '@/lib/utils/format';
import { useMemo } from 'react';
import { FiSliders } from 'react-icons/fi';
import { cn } from '@/lib/utils/cn';
import type { SplitFilters } from '@/components/management/SplitExportReportModal';

function getSplitUserEmail(value: any) {
  return typeof value === 'string' ? '' : value?.email || '';
}

interface SplitHeaderSummaryProps {
  search: string;
  filters: SplitFilters;
  onOpenFilter: () => void;
}

export function SplitHeaderSummary({
  search,
  filters,
  onOpenFilter,
}: SplitHeaderSummaryProps) {
  const { data: user } = useCurrentUser();
  const { data: splits = [] } = useSplits(search);
  const currency = user?.currency ?? 'USD';

  // Active filters count calculation
  const currentSortKey = `${filters.sortBy ?? 'date'}-${filters.sortOrder ?? 'desc'}`;
  const sortActive = currentSortKey !== 'date-desc';
  const scopeActive = !!filters.scope && filters.scope !== 'all';
  const statusActive = !!filters.status && filters.status !== 'All';
  const catActive = !!filters.category;
  const memberActive = !!filters.memberId;
  const dateActive = !!filters.from || !!filters.to;

  const activeCount =
    (sortActive ? 1 : 0) +
    (scopeActive ? 1 : 0) +
    (statusActive ? 1 : 0) +
    (catActive ? 1 : 0) +
    (memberActive ? 1 : 0) +
    (dateActive ? 1 : 0);

  const summary = useMemo(() => {
    let youOwe = 0;
    let owedToYou = 0;
    const myEmail = user?.email?.toLowerCase();

    if (!myEmail) return { youOwe, owedToYou };

    splits.forEach((split) => {
      if (split.status === 'Completed' || split.status === 'Closed') return;

      const payerEmail = getSplitUserEmail(split.paidBy).toLowerCase();
      const isPayer = payerEmail === myEmail;

      split.members.forEach((m) => {
        const memberEmail = getSplitUserEmail(m.userId).toLowerCase();
        if (memberEmail === myEmail) {
          if (!m.paid && !isPayer) {
            youOwe += m.shareAmount;
          }
        } else {
          if (!m.paid && isPayer) {
            owedToYou += m.shareAmount;
          }
        }
      });
    });

    return { youOwe, owedToYou };
  }, [splits, user]);

  return (
    <div className="mt-1 flex items-center justify-between gap-3 px-1 py-0.5">
      <div className="text-[11px] font-bold text-foreground truncate">
        You owe: <span className="font-mono text-expense">{formatCurrency(summary.youOwe, currency)}</span>
        <span className="mx-1.5 text-muted/60">•</span>
        Owed: <span className="font-mono text-income">{formatCurrency(summary.owedToYou, currency)}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Filter Button replacing All/Own pill */}
        <button
          type="button"
          onClick={onOpenFilter}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 h-7 rounded-full border px-3 text-xs font-semibold whitespace-nowrap transition-all duration-150 shadow-soft shrink-0',
            activeCount > 0
              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-border bg-surface-2 text-foreground hover:bg-surface-3'
          )}
        >
          <FiSliders size={12} className={cn(activeCount > 0 ? 'text-emerald-500' : 'text-muted')} />
          <span>Filter</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold ml-0.5">
              {activeCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

