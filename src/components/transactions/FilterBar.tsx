'use client';

import { useState } from 'react';
import { FiSearch, FiX, FiSliders } from 'react-icons/fi';
import { useCategories } from '@/hooks/useCategories';
import { DateFilterDropdown } from '@/components/common/DateFilterDropdown';
import { FilterSortModal } from '@/components/transactions/FilterSortModal';
import type { TransactionFilters } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils/cn';

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  totalRecords?: number;
}

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'income', label: '💰 Income' },
  { value: 'expense', label: '💸 Expense' },
];

export function FilterBar({ filters, onChange, totalRecords = 0 }: FilterBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: categories = [] } = useCategories();

  // Active filters count calculation
  const currentSortKey = `${filters.sortBy ?? 'date'}-${filters.sortOrder ?? 'desc'}`;
  const sortActive = currentSortKey !== 'date-desc';
  const activeCount =
    (filters.type ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0) +
    (sortActive ? 1 : 0);

  const hasActiveFilters = activeCount > 0 || !!filters.search;

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
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

      {/* Filter chips — All Chips Uniform Height (h-9) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Filter & Sort Button (Matching Image 2 & Image 3 trigger) */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'inline-flex items-center justify-center gap-2 h-9 rounded-2xl border px-3.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 shadow-soft shrink-0',
            activeCount > 0
              ? 'border-emerald-500 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-border bg-surface text-foreground hover:bg-surface-2'
          )}
        >
          <FiSliders size={13} className={cn(activeCount > 0 ? 'text-emerald-500' : 'text-muted')} />
          <span>Filter & Sort</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold ml-0.5">
              {activeCount}
            </span>
          )}
        </button>

        {/* Date Filter Dropdown */}
        <DateFilterDropdown />

        {/* Divider */}
        <div className="h-6 w-px bg-border shrink-0" />

        {/* Type filter pills */}
        <div className="flex shrink-0 items-center h-9 rounded-2xl border border-border bg-surface p-1 gap-0.5 shadow-soft">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange({ ...filters, type: (f.value || undefined) as never, page: 1 })}
              className={cn(
                'h-full inline-flex items-center justify-center rounded-xl px-3 text-xs font-semibold whitespace-nowrap transition-all duration-200',
                (filters.type ?? '') === f.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-surface-2'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <>
            <div className="h-6 w-px bg-border shrink-0" />
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => onChange({ ...filters, category: undefined, page: 1 })}
                className={cn(
                  'h-9 inline-flex items-center justify-center rounded-2xl border border-border px-3 text-xs font-semibold whitespace-nowrap transition-all duration-200',
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
                    'h-9 inline-flex items-center justify-center rounded-2xl border px-3 text-xs font-semibold whitespace-nowrap transition-all duration-200',
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
            className="shrink-0 h-9 inline-flex items-center justify-center gap-1 rounded-2xl border border-expense/30 bg-expense/8 px-3 text-xs font-semibold text-expense whitespace-nowrap"
          >
            <FiX size={11} /> Clear
          </button>
        )}
      </div>

      {/* Filter & Sort Modal */}
      <FilterSortModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filters={filters}
        onChange={onChange}
        totalRecords={totalRecords}
      />
    </div>
  );
}
