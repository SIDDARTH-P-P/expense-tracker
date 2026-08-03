'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { CategoryList } from '@/components/management/CategoryList';
import { ManagementTabs } from '@/components/management/ManagementTabs';
import { SplitList } from '@/components/management/SplitList';
import { SplitUserList } from '@/components/management/SplitUserList';
import { SplitHeaderSummary } from '@/components/management/SplitHeaderSummary';
import { SplitFilterSortModal } from '@/components/management/SplitFilterSortModal';
import type { SplitFilters } from '@/components/management/SplitExportReportModal';
import { useSplits } from '@/hooks/useManagement';
import { useDebounce } from '@/hooks/useDebounce';
import { useUIStore } from '@/store/ui.store';

export function ManagementModule() {
  const activeTab = useUIStore((s) => s.managementActiveTab);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 250);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [splitFilters, setSplitFilters] = useState<SplitFilters>({
    search: '',
    scope: 'all',
    status: 'All',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const { data: splits = [] } = useSplits(splitFilters.search);

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      {/* Sticky header — fully opaque, border separates from scrolling content */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background px-4 pb-3 pt-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/* Row 1: Title */}
        <div className="mb-2.5">
          <h1 className="font-display text-xl font-bold">Management</h1>
        </div>

        {/* Row 2: Tab switcher — full width */}
        <div className="mb-2.5">
          <ManagementTabs />
        </div>

        {/* Row 3: Search & Header Summary */}
        {activeTab === 'splits' ? (
          <div className="flex flex-col gap-2">
            <SplitHeaderSummary
              search={splitFilters.search ?? ''}
              filters={splitFilters}
              onOpenFilter={() => setIsFilterModalOpen(true)}
            />

            {/* Single Search Bar for Splits */}
            <div className="relative flex-1">
              <FiSearch size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={splitFilters.search ?? ''}
                onChange={(event) => setSplitFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Search title, category, split user, or record ID..."
                className="w-full rounded-2xl border border-border bg-surface py-2.5 pl-10 pr-10 text-sm shadow-soft placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {splitFilters.search && (
                <button
                  type="button"
                  onClick={() => setSplitFilters((prev) => ({ ...prev, search: '' }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <FiX size={15} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex-1">
            <FiSearch size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search record ID, name, email, category..."
              className="w-full rounded-2xl border border-border bg-surface py-2.5 pl-10 pr-10 text-sm shadow-soft placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <FiX size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="pt-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'category' && <CategoryList search={debouncedSearch} />}
          {activeTab === 'splitUsers' && <SplitUserList search={debouncedSearch} />}
          {activeTab === 'splits' && <SplitList filters={splitFilters} />}
        </motion.div>
      </AnimatePresence>

      {/* Split Filter Sort Modal */}
      <SplitFilterSortModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={splitFilters}
        onChange={setSplitFilters}
        totalRecords={splits.length}
      />
    </div>
  );
}



