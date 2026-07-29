'use client';

import { useState } from 'react';
import { FiSearch, FiX, FiSliders, FiDownload } from 'react-icons/fi';
import { FilterSortModal } from '@/components/transactions/FilterSortModal';
import type { TransactionFilters } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils/cn';

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  totalRecords?: number;
  onOpenExport?: () => void;
}

export function FilterBar({
  filters,
  onChange,
  totalRecords = 0,
  onOpenExport,
}: FilterBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      {/* Action Controls Row: Filter & Sort button -> Download Report button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Filter & Sort Trigger Button */}
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
          <FiSliders size={14} className={cn(activeCount > 0 ? 'text-emerald-500' : 'text-muted')} />
          <span>Filter & Sort</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold ml-0.5">
              {activeCount}
            </span>
          )}
        </button>

        {/* Download Report Button — Placed right AFTER Filter & Sort */}
        {onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center justify-center gap-2 h-9 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3.5 text-xs whitespace-nowrap transition-all duration-200 hover:bg-emerald-500/20 active:scale-95 shadow-soft shrink-0"
          >
            <FiDownload size={14} className="text-emerald-500" />
            <span>Download Report</span>
          </button>
        )}

        {/* Clear Active Filters chip */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ page: 1, pageSize: filters.pageSize })}
            className="shrink-0 h-9 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-expense/30 bg-expense/8 px-3 text-xs font-semibold text-expense whitespace-nowrap hover:bg-expense/15 transition-all"
          >
            <FiX size={12} /> Clear
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
