'use client';

import { FiSearch, FiX } from 'react-icons/fi';
import { useCategories } from '@/hooks/useCategories';
import { DateFilterDropdown } from '@/components/common/DateFilterDropdown';
import type { TransactionFilters } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils/cn';

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'income', label: '💰 Income' },
  { value: 'expense', label: '💸 Expense' },
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest' },
  { value: 'date-asc', label: 'Oldest' },
  { value: 'amount-desc', label: 'Highest' },
  { value: 'amount-asc', label: 'Lowest' },
];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { data: categories = [] } = useCategories();
  const hasActiveFilters = !!(filters.type || filters.category || filters.search);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="search"
          placeholder="Search title, category, or record ID..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-10 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '', page: 1 })}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <FiX size={15} />
          </button>
        )}
      </div>

      {/* Filter chips — horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Date Filter Dropdown */}
        <DateFilterDropdown />

        {/* Divider */}
        <div className="h-7 w-px bg-border shrink-0" />

        {/* Type filter */}
        <div className="flex shrink-0 rounded-2xl border border-border bg-surface p-1 gap-0.5 shadow-soft">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange({ ...filters, type: (f.value || undefined) as never, page: 1 })}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                (filters.type ?? '') === f.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-surface-2'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-7 w-px bg-border shrink-0" />

        {/* Sort */}
        <div className="flex shrink-0 rounded-2xl border border-border bg-surface p-1 gap-0.5 shadow-soft">
          {SORT_OPTIONS.map((s) => {
            const currentSort = `${filters.sortBy ?? 'date'}-${filters.sortOrder ?? 'desc'}`;
            return (
              <button
                key={s.value}
                onClick={() => {
                  const [sortBy, sortOrder] = s.value.split('-') as ['date' | 'amount', 'asc' | 'desc'];
                  onChange({ ...filters, sortBy, sortOrder });
                }}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  currentSort === s.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted hover:text-foreground hover:bg-surface-2'
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <>
            <div className="h-7 w-px bg-border shrink-0" />
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => onChange({ ...filters, category: undefined, page: 1 })}
                className={cn(
                  'rounded-2xl border border-border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  !filters.category
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-surface text-muted hover:text-foreground'
                )}
              >
                All cats
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onChange({ ...filters, category: filters.category === c.id ? undefined : c.id, page: 1 })}
                  className={cn(
                    'rounded-2xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                    filters.category === c.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-muted hover:text-foreground'
                  )}
                  style={filters.category === c.id ? { borderColor: c.color, backgroundColor: `${c.color}15`, color: c.color } : {}}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ page: 1, pageSize: filters.pageSize })}
            className="shrink-0 flex items-center gap-1 rounded-2xl border border-expense/30 bg-expense/8 px-3 py-1.5 text-xs font-semibold text-expense whitespace-nowrap"
          >
            <FiX size={11} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
