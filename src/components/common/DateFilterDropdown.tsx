'use client';

import { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiChevronDown } from 'react-icons/fi';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils/cn';
import { createPortal } from 'react-dom';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2024, 2025, 2026, 2027];

export function DateFilterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const dateFilterType = useUIStore((s) => s.dateFilterType);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const selectedYear = useUIStore((s) => s.selectedYear);
  const setDateFilterType = useUIStore((s) => s.setDateFilterType);
  const setSelectedMonth = useUIStore((s) => s.setSelectedMonth);
  const setSelectedYear = useUIStore((s) => s.setSelectedYear);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 224;
      let left = rect.left + window.scrollX;
      
      // If it overflows the right edge of screen, align it to the right edge of the trigger
      if (left + dropdownWidth > window.innerWidth) {
        left = rect.right + window.scrollX - dropdownWidth;
      }
      left = Math.max(16, left);

      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left,
      });
    }
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if click is inside the portal dropdown card
        const portalEl = document.getElementById('date-filter-portal-content');
        if (portalEl && portalEl.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Compute trigger label
  const label = (() => {
    if (dateFilterType === 'month') {
      return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    if (dateFilterType === 'year') {
      return `${selectedYear}`;
    }
    return 'All-Time';
  })();

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Chip */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 shadow-soft h-8',
          isOpen || dateFilterType !== 'all'
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-surface text-muted hover:text-foreground hover:bg-surface-2/40'
        )}
      >
        <FiCalendar size={13} className={cn(dateFilterType !== 'all' ? 'text-primary' : 'text-muted')} />
        <span>{label}</span>
        <FiChevronDown size={12} className={cn('transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {/* Popover Dropdown Card using React Portal */}
      {isOpen && isMounted && coords && createPortal(
        <div
          id="date-filter-portal-content"
          className="absolute z-50 w-56 rounded-2xl border border-border bg-surface p-3 shadow-lg animate-fade-in focus:outline-none"
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
        >
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Filter Range</p>

          {/* All / Month / Year switcher */}
          <div className="grid grid-cols-3 gap-0.5 bg-surface-2 border border-border/80 p-0.5 rounded-xl shadow-soft h-8 mb-3">
            {(['all', 'month', 'year'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDateFilterType(type)}
                className={cn(
                  'rounded-lg text-[10px] font-bold capitalize transition-all duration-150 h-full flex items-center justify-center',
                  dateFilterType === type
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted hover:text-foreground hover:bg-surface/50'
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Conditional dropdown selectors */}
          {dateFilterType !== 'all' && (
            <div className="flex flex-col gap-2">
              {dateFilterType === 'month' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-semibold text-muted uppercase">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-soft"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-semibold text-muted uppercase">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-soft"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
