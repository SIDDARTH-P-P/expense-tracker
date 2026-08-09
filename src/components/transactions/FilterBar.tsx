'use client';

import { useState } from 'react';
import { FiSearch, FiX, FiFilter, FiDownload } from 'react-icons/fi';
import { FilterSortModal } from '@/components/transactions/FilterSortModal';
import type { TransactionFilters } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils/cn';

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  totalRecords?: number;
  onOpenExport?: () => void;
  hideExport?: boolean;
}

export function FilterBar({
  filters,
  onChange,
  totalRecords = 0,
  onOpenExport,
  hideExport = false,
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
    <div className="flex flex-col gap-2">
      {/* Search Bar + Small Funnel Filter Icon Button + Small Download Icon Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search title, category, or record ID..."
            value={filters.search ?? ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-8 text-xs placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Filter icon button — small funnel icon, icon only */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="Filter & Sort"
          aria-label="Filter & Sort"
          className={cn(
            'relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border transition-all duration-200 shadow-xs',
            activeCount > 0
              ? 'border-primary text-primary font-bold bg-primary/5'
              : 'border-border bg-surface text-muted hover:text-foreground hover:bg-surface-2'
          )}
        >
          <FiFilter size={13} />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-white font-bold shadow-xs">
              {activeCount}
            </span>
          )}
        </button>

        {/* Download report button — small icon button, omitted if hideExport is true */}
        {onOpenExport && !hideExport && (
          <button
            type="button"
            onClick={onOpenExport}
            title="Download Report"
            aria-label="Download Report"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-2 transition-all duration-200 active:scale-95 shadow-xs"
          >
            <FiDownload size={13} />
          </button>
        )}
      </div>

      {/* Clear Active Filters chip */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onChange({ page: 1, pageSize: filters.pageSize })}
            className="shrink-0 h-7 inline-flex items-center justify-center gap-1 rounded-xl border border-expense/30 bg-expense/8 px-2.5 text-[11px] font-semibold text-expense whitespace-nowrap hover:bg-expense/15 transition-all"
          >
            <FiX size={12} /> Clear Filters
          </button>
        </div>
      )}

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
