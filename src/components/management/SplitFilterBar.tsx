'use client';

import { useState } from 'react';
import { FiSearch, FiX, FiSliders, FiDownload } from 'react-icons/fi';
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
}

export function SplitFilterBar({
  filters,
  onChange,
  splits,
  allSplits = splits,
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
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="search"
          placeholder="Search title, category, split user, or record ID..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-10 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <FiX size={15} />
          </button>
        )}
      </div>

      {/* Action Controls Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Filter & Sort Trigger Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
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

        {/* Download Report Button */}
        <button
          type="button"
          onClick={() => setIsExportModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 h-9 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3.5 text-xs whitespace-nowrap transition-all duration-200 hover:bg-emerald-500/20 active:scale-95 shadow-soft shrink-0"
        >
          <FiDownload size={14} className="text-emerald-500" />
          <span>Download Report</span>
        </button>

        {/* Clear Active Filters chip */}
        {hasActiveFilters && (
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
            className="shrink-0 h-9 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-expense/30 bg-expense/8 px-3 text-xs font-semibold text-expense whitespace-nowrap hover:bg-expense/15 transition-all"
          >
            <FiX size={12} /> Clear
          </button>
        )}
      </div>

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
