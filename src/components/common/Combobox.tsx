'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiSearch, FiCheck, FiX } from 'react-icons/fi';
import { cn } from '@/lib/utils/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  /** Allow typing free-form values not in the list */
  allowFreeInput?: boolean;
  className?: string;
  id?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select or search…',
  error,
  allowFreeInput = false,
  className,
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? 'combobox';

  const selected = options.find((o) => o.value === value);

  // Filter options by query
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const selectOption = useCallback(
    (opt: ComboboxOption) => {
      onChange(opt.value);
      setOpen(false);
      setQuery('');
    },
    [onChange]
  );

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        selectOption(filtered[activeIndex]);
      } else if (allowFreeInput && query.trim()) {
        onChange(query.trim());
        setOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <div className="relative">
        <button
          type="button"
          id={inputId}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={handleOpen}
          className={cn(
            'flex h-12 w-full items-center gap-2 rounded-2xl border bg-surface px-4 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
            error ? 'border-expense focus:border-expense focus:ring-expense/20' : 'border-border focus:border-primary',
            open && 'border-primary ring-2 ring-primary/20'
          )}
        >
          {selected?.icon && (
            <span className="shrink-0 text-muted">{selected.icon}</span>
          )}
          <span className={cn('flex-1 truncate', !selected && 'text-muted')}>
            {selected ? selected.label : placeholder}
          </span>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 text-muted hover:text-foreground transition-colors"
              aria-label="Clear selection"
            >
              <FiX size={14} />
            </button>
          )}
          <FiChevronDown
            size={16}
            className={cn('shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')}
          />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
            >
              {/* Search input inside dropdown */}
              <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <FiSearch size={14} className="shrink-0 text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                  autoComplete="off"
                />
              </div>

              {/* Options list */}
              <ul
                role="listbox"
                className="max-h-52 overflow-y-auto py-1.5"
              >
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-center text-sm text-muted">
                    No results found
                  </li>
                ) : (
                  filtered.map((opt, i) => {
                    const isSelected = opt.value === value;
                    const isActive = i === activeIndex;
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => selectOption(opt)}
                        className={cn(
                          'flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition-colors',
                          isActive && 'bg-primary/8 text-primary',
                          !isActive && isSelected && 'text-primary',
                          !isActive && !isSelected && 'text-foreground hover:bg-surface-2'
                        )}
                      >
                        {opt.icon && (
                          <span className="shrink-0">{opt.icon}</span>
                        )}
                        <span className="flex-1 truncate">{opt.label}</span>
                        {isSelected && (
                          <FiCheck size={14} className="shrink-0 text-primary" />
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-xs text-expense">{error}</p>}
    </div>
  );
}
