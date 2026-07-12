'use client';

import { useCurrentUser } from '@/hooks/useAuth';
import { useSplits, useSplitUsers } from '@/hooks/useManagement';
import { formatCurrency } from '@/lib/utils/format';
import { useUIStore } from '@/store/ui.store';
import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';

function getSplitUserEmail(value: any) {
  return typeof value === 'string' ? '' : value?.email || '';
}

export function SplitHeaderSummary({ search }: { search: string }) {
  const { data: user } = useCurrentUser();
  const { data: splits = [] } = useSplits(search);

  const filterMode = useUIStore((s) => s.splitFilterMode);
  const setFilterMode = useUIStore((s) => s.setSplitFilterMode);
  const currency = user?.currency ?? 'USD';

  const summary = useMemo(() => {
    let youOwe = 0;
    let owedToYou = 0;
    const myEmail = user?.email?.toLowerCase();

    if (!myEmail) return { youOwe, owedToYou };

    splits.forEach((split) => {
      if (split.status === 'Completed') return;

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

      <div className="flex items-center rounded-full bg-surface-2 p-0.5 border border-border/80 shadow-soft h-6.5 shrink-0">
        {(['all', 'own'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilterMode(mode)}
            className={cn(
              'rounded-full px-2.5 py-0 text-[10px] font-bold capitalize transition-all duration-150 h-full flex items-center justify-center',
              filterMode === mode
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-surface/50'
            )}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
