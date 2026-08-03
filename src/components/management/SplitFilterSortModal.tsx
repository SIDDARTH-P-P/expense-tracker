'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCalendar, FiRotateCcw, FiCheck } from 'react-icons/fi';
import { useCategories } from '@/hooks/useCategories';
import { useSplitUsers } from '@/hooks/useManagement';
import { useUIStore } from '@/store/ui.store';
import { WheelDatePickerModal } from '@/components/common/WheelDatePickerModal';
import type { SplitFilters } from '@/components/management/SplitExportReportModal';
import { cn } from '@/lib/utils/cn';

interface SplitFilterSortModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SplitFilters;
  onChange: (filters: SplitFilters) => void;
  totalRecords?: number;
}

type TabType = 'sort' | 'scopeStatus' | 'categories' | 'members' | 'date';

const SORT_OPTIONS = [
  { id: 'date-desc', label: 'Relevance (Newest)' },
  { id: 'date-asc', label: 'Date (Oldest to newest)' },
  { id: 'amount-asc', label: 'Amount (Low to high)' },
  { id: 'amount-desc', label: 'Amount (High to low)' },
];

const SCOPE_OPTIONS = [
  { id: 'all', label: 'All Splits' },
  { id: 'own', label: 'My Own Splits (I Paid)' },
  { id: 'owe', label: 'Splits I Owe' },
  { id: 'owed', label: 'Splits Owed to Me' },
];

const STATUS_OPTIONS = [
  { id: 'All', label: 'All Statuses' },
  { id: 'Pending', label: 'Pending Only' },
  { id: 'Partially Paid', label: 'Partially Paid' },
  { id: 'Completed', label: 'Completed Only' },
];

export function SplitFilterSortModal({
  isOpen,
  onClose,
  filters,
  onChange,
}: SplitFilterSortModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('sort');

  // Local state for pending filters inside modal
  const [tempFilters, setTempFilters] = useState<SplitFilters>(filters);

  // Wheel date picker modal state
  const [wheelPickerOpen, setWheelPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.from ? new Date(filters.from) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.to ? new Date(filters.to) : undefined
  );

  const { data: categories = [] } = useCategories();
  const { data: splitUsers = [] } = useSplitUsers();

  const dateFilterType = useUIStore((s) => s.dateFilterType);
  const setDateFilterType = useUIStore((s) => s.setDateFilterType);
  const setCustomDateRange = useUIStore((s) => s.setCustomDateRange);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
      setStartDate(filters.from ? new Date(filters.from) : undefined);
      setEndDate(filters.to ? new Date(filters.to) : undefined);
    }
  }, [isOpen, filters]);

  if (!isOpen || !mounted) return null;

  // Active badges count calculation
  const currentSortKey = `${tempFilters.sortBy ?? 'date'}-${tempFilters.sortOrder ?? 'desc'}`;
  const sortActive = currentSortKey !== 'date-desc';
  const scopeStatusActive = (tempFilters.scope && tempFilters.scope !== 'all') || (tempFilters.status && tempFilters.status !== 'All');
  const catActive = !!tempFilters.category;
  const memberActive = !!tempFilters.memberId;
  const dateActive = dateFilterType !== 'all' || !!tempFilters.from || !!tempFilters.to;

  const totalActiveCount =
    (sortActive ? 1 : 0) +
    (scopeStatusActive ? 1 : 0) +
    (catActive ? 1 : 0) +
    (memberActive ? 1 : 0) +
    (dateActive ? 1 : 0);

  const handleApply = () => {
    onChange(tempFilters);
    onClose();
  };

  const handleClearAll = () => {
    const cleared: SplitFilters = {
      search: filters.search,
      sortBy: 'date',
      sortOrder: 'desc',
      scope: 'all',
      status: 'All',
      category: undefined,
      memberId: undefined,
      from: undefined,
      to: undefined,
    };
    setTempFilters(cleared);
    setDateFilterType('all');
    setCustomDateRange(null, null);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const openWheelFor = (target: 'start' | 'end') => {
    setPickerTarget(target);
    setWheelPickerOpen(true);
  };

  const handleDatePicked = (picked: Date) => {
    const formatted = picked.toISOString().split('T')[0];
    setDateFilterType('custom');
    if (pickerTarget === 'start') {
      setStartDate(picked);
      const newFrom = formatted;
      const newTo = endDate ? endDate.toISOString().split('T')[0] : formatted;
      setTempFilters((prev) => ({ ...prev, from: newFrom, to: newTo }));
      setCustomDateRange(newFrom, newTo);
    } else {
      setEndDate(picked);
      const newFrom = startDate ? startDate.toISOString().split('T')[0] : formatted;
      const newTo = formatted;
      setTempFilters((prev) => ({ ...prev, from: newFrom, to: newTo }));
      setCustomDateRange(newFrom, newTo);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      {/* Modal Container — Fixed Height (h-[490px]) */}
      <div className="w-full max-w-lg bg-surface text-foreground rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col h-[490px] max-h-[90vh] animate-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight">Split Filters</h2>
            {totalActiveCount > 0 ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {totalActiveCount} Applied
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted bg-surface-2 px-2.5 py-0.5 rounded-md border border-border/50">
                Default
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 text-muted hover:text-foreground transition-all active:scale-95"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body: 2-Column Split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-2/5 max-w-[170px] border-r border-border bg-surface-2/20 p-2.5 flex flex-col gap-1.5 shrink-0 overflow-y-auto">
            {/* Tab 1: Sort by */}
            <button
              type="button"
              onClick={() => setActiveTab('sort')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                activeTab === 'sort'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-2/50 border border-transparent'
              )}
            >
              <span>Sort by</span>
              {sortActive && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold">
                  1
                </span>
              )}
            </button>

            {/* Tab 2: Scope & Status */}
            <button
              type="button"
              onClick={() => setActiveTab('scopeStatus')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                activeTab === 'scopeStatus'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-2/50 border border-transparent'
              )}
            >
              <span>Scope & Status</span>
              {scopeStatusActive && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold">
                  1
                </span>
              )}
            </button>

            {/* Tab 3: Categories */}
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                activeTab === 'categories'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-2/50 border border-transparent'
              )}
            >
              <span>Categories</span>
              {catActive && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold">
                  1
                </span>
              )}
            </button>

            {/* Tab 4: Split Users */}
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                activeTab === 'members'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-2/50 border border-transparent'
              )}
            >
              <span>Split Users</span>
              {memberActive && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold">
                  1
                </span>
              )}
            </button>

            {/* Tab 5: Date Range */}
            <button
              type="button"
              onClick={() => setActiveTab('date')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                activeTab === 'date'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-2/50 border border-transparent'
              )}
            >
              <span>Date Range</span>
              {dateActive && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-4 overflow-y-auto bg-surface">
            {/* Sort Tab Content */}
            {activeTab === 'sort' && (
              <div className="flex flex-col gap-2.5">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = currentSortKey === opt.id;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => {
                        const [sortBy, sortOrder] = opt.id.split('-') as ['date' | 'amount', 'asc' | 'desc'];
                        setTempFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                      }}
                      className={cn(
                        'flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all border',
                        isSelected
                          ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-500 font-semibold'
                          : 'border-border/60 hover:bg-surface-2/40 text-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                          isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-muted/40 bg-transparent'
                        )}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </div>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Scope & Status Tab Content */}
            {activeTab === 'scopeStatus' && (
              <div className="flex flex-col gap-4">
                {/* Scope */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider">Split Scope</p>
                  {SCOPE_OPTIONS.map((opt) => {
                    const isSelected = (tempFilters.scope ?? 'all') === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() =>
                          setTempFilters((prev) => ({
                            ...prev,
                            scope: opt.id as any,
                          }))
                        }
                        className={cn(
                          'flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-all border',
                          isSelected
                            ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-500 font-semibold'
                            : 'border-border/60 hover:bg-surface-2/40 text-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                            isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-muted/40 bg-transparent'
                          )}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                        </div>
                        <span className="text-xs font-medium">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Status */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider">Status</p>
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = (tempFilters.status ?? 'All') === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() =>
                          setTempFilters((prev) => ({
                            ...prev,
                            status: opt.id as any,
                          }))
                        }
                        className={cn(
                          'flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-all border',
                          isSelected
                            ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-500 font-semibold'
                            : 'border-border/60 hover:bg-surface-2/40 text-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                            isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-muted/40 bg-transparent'
                          )}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                        </div>
                        <span className="text-xs font-medium">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories Tab Content */}
            {activeTab === 'categories' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Filter by Category</p>
                <label
                  onClick={() => setTempFilters((prev) => ({ ...prev, category: undefined }))}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-all border',
                    !tempFilters.category
                      ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-500 font-semibold'
                      : 'border-border/60 hover:bg-surface-2/40 text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                      !tempFilters.category ? 'border-emerald-500 bg-emerald-500/10' : 'border-muted/40 bg-transparent'
                    )}
                  >
                    {!tempFilters.category && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                  </div>
                  <span className="text-xs font-medium">All Categories</span>
                </label>

                {categories.map((cat) => {
                  const isSelected = tempFilters.category === cat.id;
                  return (
                    <label
                      key={cat.id}
                      onClick={() => setTempFilters((prev) => ({ ...prev, category: cat.id }))}
                      className={cn(
                        'flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-all border',
                        isSelected
                          ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-500 font-semibold'
                          : 'border-border/60 hover:bg-surface-2/40 text-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                          isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-muted/40 bg-transparent'
                        )}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-medium">{cat.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Split Users Tab Content */}
            {activeTab === 'members' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Filter by Split User</p>
                <label
                  onClick={() => setTempFilters((prev) => ({ ...prev, memberId: undefined }))}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-all border',
                    !tempFilters.memberId
                      ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-500 font-semibold'
                      : 'border-border/60 hover:bg-surface-2/40 text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                      !tempFilters.memberId ? 'border-emerald-500 bg-emerald-500/10' : 'border-muted/40 bg-transparent'
                    )}
                  >
                    {!tempFilters.memberId && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                  </div>
                  <span className="text-xs font-medium">All Members</span>
                </label>

                {splitUsers.map((usr) => {
                  const isSelected = tempFilters.memberId === usr.id;
                  return (
                    <label
                      key={usr.id}
                      onClick={() => setTempFilters((prev) => ({ ...prev, memberId: usr.id }))}
                      className={cn(
                        'flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-all border',
                        isSelected
                          ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-500 font-semibold'
                          : 'border-border/60 hover:bg-surface-2/40 text-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                          isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-muted/40 bg-transparent'
                        )}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </div>
                      <span className="text-xs font-medium">{usr.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Date Range Tab Content */}
            {activeTab === 'date' && (
              <div className="flex flex-col gap-3.5">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Select Date Scope</p>

                {/* All-Time */}
                <button
                  type="button"
                  onClick={() => {
                    setDateFilterType('all');
                    setTempFilters((prev) => ({ ...prev, from: undefined, to: undefined }));
                  }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left',
                    dateFilterType === 'all' && !tempFilters.from
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'border-border bg-surface hover:bg-surface-2/50 text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        dateFilterType === 'all' && !tempFilters.from ? 'border-emerald-500 bg-emerald-500' : 'border-muted/40'
                      )}
                    >
                      {dateFilterType === 'all' && !tempFilters.from && <FiCheck size={10} className="text-white" />}
                    </div>
                    <span>All-Time</span>
                  </div>
                </button>

                {/* Selected Month Card */}
                <button
                  type="button"
                  onClick={() => {
                    setDateFilterType('month');
                    setTempFilters((prev) => ({ ...prev, from: undefined, to: undefined }));
                  }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left',
                    dateFilterType === 'month' && !tempFilters.from
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'border-border bg-surface hover:bg-surface-2/50 text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        dateFilterType === 'month' && !tempFilters.from ? 'border-emerald-500 bg-emerald-500' : 'border-muted/40'
                      )}
                    >
                      {dateFilterType === 'month' && !tempFilters.from && <FiCheck size={10} className="text-white" />}
                    </div>
                    <span>Selected Month Filter</span>
                  </div>
                </button>

                {/* Custom Wheel Date Range Card */}
                <div className="pt-2 border-t border-border flex flex-col gap-2.5">
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Custom Date Range</p>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => openWheelFor('start')}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-surface-2/60 text-left transition-all active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <FiCalendar size={16} className="text-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted font-bold uppercase">Start Date</span>
                          <span className="text-xs font-semibold text-foreground">
                            {startDate
                              ? `${startDate.getDate()} ${startDate.toLocaleString('en-US', { month: 'short' })} ${startDate.getFullYear()}`
                              : 'Tap to select start date'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
                        Change
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openWheelFor('end')}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-surface-2/60 text-left transition-all active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <FiCalendar size={16} className="text-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted font-bold uppercase">End Date</span>
                          <span className="text-xs font-semibold text-foreground">
                            {endDate
                              ? `${endDate.getDate()} ${endDate.toLocaleString('en-US', { month: 'short' })} ${endDate.getFullYear()}`
                              : 'Tap to select end date'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">
                        Change
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-surface pb-6 sm:pb-4 gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2/80 hover:bg-surface-3 text-foreground text-sm font-bold transition-all active:scale-95 shadow-xs"
          >
            <FiRotateCcw size={15} />
            <span>Clear All</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all active:scale-95 shadow-md"
          >
            <span>Apply Filter</span>
          </button>
        </div>
      </div>

      {/* Wheel Date Picker Sub-Modal */}
      <WheelDatePickerModal
        isOpen={wheelPickerOpen}
        onClose={() => setWheelPickerOpen(false)}
        title={pickerTarget === 'start' ? 'Start date' : 'End date'}
        initialDate={pickerTarget === 'start' ? startDate ?? new Date() : endDate ?? new Date()}
        onSelectDate={handleDatePicked}
      />
    </div>,
    document.body
  );
}
