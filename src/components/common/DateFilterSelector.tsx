'use client';

import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils/cn';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2024, 2025, 2026, 2027];

interface DateFilterSelectorProps {
  className?: string;
}

export function DateFilterSelector({ className }: DateFilterSelectorProps) {
  const dateFilterType = useUIStore((s) => s.dateFilterType);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const selectedYear = useUIStore((s) => s.selectedYear);
  const setDateFilterType = useUIStore((s) => s.setDateFilterType);
  const setSelectedMonth = useUIStore((s) => s.setSelectedMonth);
  const setSelectedYear = useUIStore((s) => s.setSelectedYear);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-0.5 bg-surface border border-border p-0.5 rounded-full shadow-soft h-8 shrink-0">
        {(['all', 'month', 'year'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setDateFilterType(type)}
            className={cn(
              'rounded-full px-3 py-0.5 text-[11px] font-bold capitalize transition-all duration-200 h-full flex items-center justify-center',
              dateFilterType === type
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-surface-2/40'
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {dateFilterType !== 'all' && (
        <div className="flex items-center gap-1.5">
          {dateFilterType === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-xl border border-border bg-surface px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-soft h-8"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-xl border border-border bg-surface px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-soft h-8"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
