'use client';

import { useState } from 'react';
import { FiSearch, FiX, FiFilter, FiDownload } from 'react-icons/fi';
import { SplitFilterSortModal } from '@/components/management/SplitFilterSortModal';
import { SplitExportReportModal, type SplitFilters } from '@/components/management/SplitExportReportModal';
import type { Split } from '@/types';
import { useCurrentUser } from '@/hooks/useAuth';
import { cn } from '@/lib/utils/cn';

interface SplitFilterBarProps {
  filters: SplitFilters;
  onChange: (filters: SplitFilters) => void;
  splits: Split[];
  allSplits?: Split[];
  hideExport?: boolean;
}

export function SplitFilterBar({
  filters,
  onChange,
  splits,
  allSplits = splits,
  hideExport = false,
}: SplitFilterBarProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { data: user } = useCurrentUser();

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

  const hasActiveFilters = activeCount > 0 || !!filters.search;

  return (
    <div className="flex flex-col gap-2">
      {/* Search Bar + Small Funnel Filter Icon Button + Small Download Icon Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search title, category, split user, or record ID..."
            value={filters.search ?? ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-8 text-xs placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Filter icon button — small funnel icon, icon only */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
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
        {!hideExport && (
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
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
            onClick={() =>
              onChange({
                search: '',
                scope: 'all',
                status: 'All',
                category: undefined,
                memberId: undefined,
                sortBy: 'date',
                sortOrder: 'desc',
                from: undefined,
                to: undefined,
              })
            }
            className="shrink-0 h-7 inline-flex items-center justify-center gap-1 rounded-xl border border-expense/30 bg-expense/8 px-2.5 text-[11px] font-semibold text-expense whitespace-nowrap hover:bg-expense/15 transition-all"
          >
            <FiX size={12} /> Clear Filters
          </button>
        </div>
      )}

      {/* Filter & Sort Modal */}
      <SplitFilterSortModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onChange={onChange}
        totalRecords={splits.length}
      />

      {/* Export Report Modal */}
      <SplitExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        splits={splits}
        allSplits={allSplits}
        activeFilters={filters}
        userEmail={user?.email}
      />
    </div>
  );
}
