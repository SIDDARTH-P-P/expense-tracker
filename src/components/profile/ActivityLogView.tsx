'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FiArrowLeft,
  FiClock,
  FiSearch,
  FiUser,
  FiShield,
  FiDollarSign,
  FiUsers,
  FiBookOpen,
  FiGrid,
  FiRefreshCw,
  FiEye,
  FiActivity,
  FiLayers,
  FiMessageSquare,
  FiFilter,
  FiX,
  FiRotateCcw,
  FiLoader,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useInfiniteActivityLog, ActivityLogItem } from '@/hooks/useActivityLog';
import { cn } from '@/lib/utils/cn';
import { BottomSheet } from '@/components/common/BottomSheet';

const CATEGORY_OPTIONS = [
  { id: 'ALL', label: 'All Categories', color: '#3B82F6', icon: FiLayers },
  { id: 'PROFILE', label: 'Profile', color: '#A855F7', icon: FiUser },
  { id: 'SECURITY', label: 'Security', color: '#F59E0B', icon: FiShield },
  { id: 'TRANSACTION', label: 'Transactions', color: '#10B981', icon: FiDollarSign },
  { id: 'SPLIT', label: 'Split', color: '#6366F1', icon: FiUsers },
  { id: 'NOTEBOOK', label: 'Collections', color: '#14B8A6', icon: FiBookOpen },
  { id: 'CATEGORY', label: 'Categories', color: '#EC4899', icon: FiGrid },
] as const;

const SORT_OPTIONS = [
  { id: 'date-desc', label: 'Relevance (Newest first)' },
  { id: 'date-asc', label: 'Date (Oldest first)' },
] as const;

function getCategoryConfig(category: string) {
  switch (category) {
    case 'PROFILE':
      return { label: 'Profile', color: '#A855F7', icon: FiUser };
    case 'SECURITY':
    case 'AUTH':
      return { label: 'Security', color: '#F59E0B', icon: FiShield };
    case 'TRANSACTION':
      return { label: 'Transaction', color: '#10B981', icon: FiDollarSign };
    case 'SPLIT':
      return { label: 'Split', color: '#6366F1', icon: FiUsers };
    case 'NOTEBOOK':
      return { label: 'Collection', color: '#14B8A6', icon: FiBookOpen };
    case 'CATEGORY':
      return { label: 'Category', color: '#EC4899', icon: FiGrid };
    default:
      return { label: 'General', color: '#3B82F6', icon: FiActivity };
  }
}

function getDeviceEmoji(deviceType?: string): string {
  const dt = (deviceType || '').toLowerCase();
  if (dt.includes('mobile') || dt.includes('phone')) return '📱';
  if (dt.includes('tablet')) return '📟';
  return '💻';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'UNKNOWN';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function groupLogsByDate(logs: ActivityLogItem[]) {
  const groups: Record<string, ActivityLogItem[]> = {};

  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  logs.forEach((log) => {
    const logDate = new Date(log.timestamp);
    const dateStr = logDate.toDateString();

    let groupTitle = logDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    if (dateStr === todayStr) groupTitle = 'TODAY';
    else if (dateStr === yesterdayStr) groupTitle = 'YESTERDAY';

    if (!groups[groupTitle]) groups[groupTitle] = [];
    groups[groupTitle].push(log);
  });

  return groups;
}

export interface ActivityLogViewProps {
  hideHeader?: boolean;
}

export function ActivityLogView({ hideHeader = false }: ActivityLogViewProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLog, setExpandedLog] = useState<ActivityLogItem | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    refetch,
  } = useInfiniteActivityLog({
    pageSize: 20,
    category: selectedCategory,
    search: searchQuery,
  });

  // Flatten infinite query pages into single log items list
  const logs = useMemo(
    () => data?.pages?.flatMap((p) => p?.items ?? []) ?? [],
    [data]
  );

  const totalRecords = data?.pages[0]?.pagination.total ?? 0;

  // Infinite Scroll Observer (Strict scroll-triggered pagination)
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isLoading && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isLoading, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || isLoading) return;
    const observer = new IntersectionObserver(observerCallback, { rootMargin: '0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback, isLoading]);

  const groupedLogs = useMemo(() => groupLogsByDate(logs), [logs]);
  const activeFiltersCount = (selectedCategory !== 'ALL' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className={cn("mx-auto w-full max-w-4xl relative", !hideHeader && "px-3 sm:px-6")}>
      {/* ── TOP HEADER + SEARCH BAR ── */}
      <div className={cn("mb-4", !hideHeader ? "sticky top-0 z-20 -mx-3 sm:-mx-6 border-b border-border bg-background px-3 pt-3 pb-3 sm:px-6 shadow-xs" : "pt-1 pb-1")}>
        {!hideHeader && (
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-2 transition-colors shadow-xs"
                title="Back to Profile"
              >
                <FiArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-display text-foreground">Activity Log</h1>
                  {isFetching && <FiRefreshCw size={13} className="animate-spin text-primary" />}
                </div>
                <p className="text-xs text-muted">{totalRecords} records logged</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2 transition-colors shadow-xs"
            >
              <FiRefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        )}

        {/* Search Bar + Funnel Filter Button (1:1 match to FilterBar.tsx) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="search"
                placeholder="Search title, category, device..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-8 text-xs placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Funnel Filter Icon Button — 1:1 match to FilterBar.tsx */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              title="Filter Activities"
              aria-label="Filter Activities"
              className={cn(
                'relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border transition-all duration-200 shadow-xs',
                activeFiltersCount > 0
                  ? 'border-primary text-primary font-bold bg-primary/10'
                  : 'border-border bg-surface text-muted hover:text-foreground hover:bg-surface-2'
              )}
            >
              <FiFilter size={13} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-white font-bold shadow-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters chip — 1:1 match to FilterBar.tsx */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="shrink-0 h-7 inline-flex items-center justify-center gap-1 rounded-xl border border-expense/30 bg-expense/8 px-2.5 text-[11px] font-semibold text-expense whitespace-nowrap hover:bg-expense/15 transition-all"
              >
                <FiX size={12} /> Clear Filters
              </button>
              {selectedCategory !== 'ALL' && (
                <span className="rounded-xl bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                  Category: {getCategoryConfig(selectedCategory).label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity Log Items (Exact Transaction Card Match) ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
          <p className="text-xs text-muted font-medium">Loading activity records...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center bg-surface/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted mb-3">
            <FiClock size={22} />
          </div>
          <h3 className="text-xs font-bold text-foreground mb-1">No Activity Records</h3>
          <p className="text-[11px] text-muted max-w-sm">
            {searchQuery || selectedCategory !== 'ALL'
              ? 'No activity logs match your current search query or category filter.'
              : 'Security events, transactions, and profile changes will be logged here.'}
          </p>
          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="mt-3 rounded-xl bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedLogs).map(([groupTitle, groupItems]) => (
            <div key={groupTitle}>
              {/* Date Group Header — Exact match to TransactionList */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                  {groupTitle}
                </span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              {/* Exact Transaction Card Matching Items */}
              <div className="flex flex-col gap-2">
                {groupItems.map((log) => {
                  const cfg = getCategoryConfig(log.category);
                  const Icon = cfg.icon;
                  const changes = log.details?.changes as any[] | undefined;

                  return (
                    <div
                      key={log.id}
                      onClick={() => setExpandedLog(log)}
                      className="relative flex select-none items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:shadow-soft sm:p-3.5 cursor-pointer"
                    >
                      {/* Left Category Icon Box — Exact match to TransactionCard */}
                      <div
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-soft"
                        style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Main Center Content Column (3-line matching TransactionCard) */}
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                        {/* Line 1: Title (left) + IP Address (right) */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{log.title}</p>
                            {(log.description || (changes && changes.length > 0)) && (
                              <FiMessageSquare size={10} className="shrink-0 text-muted" />
                            )}
                          </div>
                          <span className="shrink-0 font-mono text-xs font-bold text-muted">
                            {log.device?.ip || '127.0.0.1'}
                          </span>
                        </div>

                        {/* Line 2: Subtitle (Category · Device Name) */}
                        <div className="flex items-center gap-1 text-xs text-muted min-w-0 truncate">
                          <span className="font-medium text-muted/90">{cfg.label}</span>
                          <span className="opacity-40">·</span>
                          <span className="truncate">{log.device?.deviceName || 'Unknown Device'}</span>
                        </div>

                        {/* Line 3: Timestamp (left) + Action Icons (right) */}
                        <div className="flex items-center justify-between gap-2 min-w-0 mt-0.5 text-xs text-muted">
                          <span className="whitespace-nowrap text-[11px] text-muted">
                            {formatDate(log.timestamp)} · {formatTime(log.timestamp)}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Device Emoji badge */}
                            <span
                              className="inline-flex h-5 items-center justify-center shrink-0 rounded-lg bg-surface-2 px-1.5 text-[11px] text-muted"
                              title={log.device?.deviceName}
                            >
                              {getDeviceEmoji(log.device?.deviceType)}
                            </span>

                            {/* View details eye icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedLog(log);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                              aria-label="View details"
                            >
                              <FiEye size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Infinite Scroll Sentinel Ref (1:1 match to TransactionList) ── */}
      <div ref={sentinelRef} className="py-2" />

      {/* Infinite Scroll Loading Spinner */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <FiLoader size={20} className="animate-spin text-primary" />
        </div>
      )}

      {/* End of Infinite Scroll Notice */}
      {!hasNextPage && logs.length > 0 && (
        <p className="py-4 text-center text-xs text-muted font-medium">
          All {logs.length} activity records loaded
        </p>
      )}

      {/* ── Filter & Sort Modal (1:1 Match to FilterSortModal.tsx) ── */}
      <ActivityFilterSortModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedCategory={selectedCategory}
        onApply={(cat) => {
          setSelectedCategory(cat);
        }}
      />

      {/* ── Detailed Activity Log Bottom Sheet ── */}
      <BottomSheet
        isOpen={!!expandedLog}
        onClose={() => setExpandedLog(null)}
        title="Activity details"
        showHeader={false}
        className="max-h-[90vh] bg-surface p-0 sm:max-w-[480px] sm:rounded-2xl sm:border"
      >
        {expandedLog && (
          <div className="flex flex-col p-5 space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl font-bold"
                  style={{
                    backgroundColor: `${getCategoryConfig(expandedLog.category).color}18`,
                    color: getCategoryConfig(expandedLog.category).color,
                  }}
                >
                  <FiActivity size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{expandedLog.title}</h3>
                  <p className="text-xs text-muted">{getCategoryConfig(expandedLog.category).label} Activity</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpandedLog(null)}
                className="rounded-xl bg-surface-2 px-3 py-1 text-xs font-semibold text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>

            {expandedLog.description && (
              <div className="rounded-xl bg-surface-2/60 p-3 text-xs text-foreground/90 leading-relaxed border border-border/40">
                {expandedLog.description}
              </div>
            )}

            {/* Field Diff Breakdown */}
            {expandedLog.details?.changes && expandedLog.details.changes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Field Changes
                </p>
                <div className="rounded-xl border border-border/50 bg-surface-2/60 overflow-hidden divide-y divide-border/30">
                  {expandedLog.details.changes.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="font-semibold text-foreground/90">{item.label || item.field}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded line-through">
                          {String(item.oldValue)}
                        </span>
                        <span className="text-muted">➔</span>
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                          {String(item.newValue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device & Connection Metadata */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Device & Connection Metadata
              </p>
              <div className="rounded-xl border border-border/40 bg-surface-2/40 p-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/20 pb-1.5">
                  <span className="text-muted">Device Name:</span>
                  <span className="font-semibold text-foreground">{expandedLog.device?.deviceName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-1.5">
                  <span className="text-muted">Browser:</span>
                  <span className="font-semibold text-foreground">{expandedLog.device?.browser || 'Unknown'}</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-1.5">
                  <span className="text-muted">Operating System:</span>
                  <span className="font-semibold text-foreground">{expandedLog.device?.os || 'Unknown'}</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-1.5">
                  <span className="text-muted">IP Address:</span>
                  <span className="font-mono font-semibold text-foreground">{expandedLog.device?.ip || '127.0.0.1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Timestamp:</span>
                  <span className="font-mono text-foreground">{formatDate(expandedLog.timestamp)} · {formatTime(expandedLog.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

{/* ── Sub-component: Filter & Sort Modal (Identical 2-Column Split to FilterSortModal.tsx) ── */}
function ActivityFilterSortModal({
  isOpen,
  onClose,
  selectedCategory,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onApply: (category: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'sort'>('categories');
  const [tempCategory, setTempCategory] = useState(selectedCategory);
  const [tempSort, setTempSort] = useState('date-desc');
  const [render, setRender] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setTempCategory(selectedCategory);
      const timer = setTimeout(() => setActive(true), 20);
      return () => clearTimeout(timer);
    } else {
      setActive(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedCategory]);

  if (!render || !mounted) return null;

  const isApplied = tempCategory !== 'ALL';

  const handleApply = () => {
    onApply(tempCategory);
    onClose();
  };

  const handleClearAll = () => {
    setTempCategory('ALL');
    setTempSort('date-desc');
  };

  return createPortal(
    <div
      onClick={onClose}
      className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 transition-opacity duration-300 ease-out',
        active ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Modal Container — 1:1 match to FilterSortModal.tsx */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-lg bg-surface text-foreground rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col h-[490px] max-h-[90vh] transition-all duration-300 ease-out transform',
          active
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-full sm:translate-y-6 opacity-0 sm:scale-95'
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight">Filters</h2>
            {isApplied ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                1 Applied
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

        {/* Modal Body: Fixed Height 2-Column Split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-2/5 max-w-[170px] border-r border-border bg-surface-2/20 p-2.5 flex flex-col gap-1.5 shrink-0 overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-3 rounded-xl text-xs font-semibold transition-all text-left',
                activeTab === 'categories'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-2/50 border border-transparent'
              )}
            >
              <span>Categories</span>
              {isApplied && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-[10px] text-white font-bold">
                  1
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sort')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-3 rounded-xl text-xs font-semibold transition-all text-left',
                activeTab === 'sort'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-2/50 border border-transparent'
              )}
            >
              <span>Sort by</span>
            </button>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-4 overflow-y-auto bg-surface">
            {/* Categories Content */}
            {activeTab === 'categories' && (
              <div className="flex flex-col gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = tempCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <label
                      key={cat.id}
                      onClick={() => setTempCategory(cat.id)}
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
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-muted/40 bg-transparent'
                        )}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-4 h-4 rounded-md shrink-0 shadow-xs flex items-center justify-center text-[10px]"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <Icon size={12} />
                        </span>
                        <span className="text-sm font-medium truncate">{cat.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Sort Content */}
            {activeTab === 'sort' && (
              <div className="flex flex-col gap-2.5">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = tempSort === opt.id;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => setTempSort(opt.id)}
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
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-muted/40 bg-transparent'
                        )}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Bar: Clear All & Apply Filter (1:1 match to FilterSortModal.tsx) */}
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
    </div>,
    document.body
  );
}
