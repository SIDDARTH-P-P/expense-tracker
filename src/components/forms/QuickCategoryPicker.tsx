'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { FiSearch, FiCheck, FiChevronDown, FiX } from 'react-icons/fi';
import type { Category } from '@/types';
import { cn } from '@/lib/utils/cn';

interface QuickCategoryPickerProps {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export function QuickCategoryPicker({ categories, value, onChange, error }: QuickCategoryPickerProps) {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The currently selected category object
  const selectedCategory = categories.find((c) => c.id === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.recordId.toLowerCase().includes(q)
    );
  }, [categories, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function handleSelect(cat: Category) {
    onChange(cat.id);
    setDropdownOpen(false);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setSearch('');
  }

  function openDropdown() {
    setDropdownOpen(true);
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Category</label>
        {error && <span className="text-xs font-medium text-expense">{error}</span>}
      </div>

      {/* ── Autocomplete trigger ── */}
      <div className="relative">
        <button
          type="button"
          onClick={openDropdown}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          className={cn(
            'flex h-12 w-full items-center gap-2.5 rounded-2xl border bg-surface px-4 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
            error ? 'border-expense' : 'border-border hover:border-border/80',
            dropdownOpen && 'border-primary ring-2 ring-primary/20'
          )}
        >
          {selectedCategory ? (
            <>
              {/* Selected category icon + name */}
              {(() => {
                const Icon = (Icons[selectedCategory.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
                return (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
                  >
                    <Icon size={13} />
                  </span>
                );
              })()}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-foreground">{selectedCategory.name}</span>
                <span className="truncate text-[10px] uppercase text-muted">{selectedCategory.type} · {selectedCategory.recordId}</span>
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="shrink-0 text-muted hover:text-foreground transition-colors"
                aria-label="Clear category"
              >
                <FiX size={14} />
              </button>
            </>
          ) : (
            <>
              <FiSearch size={14} className="shrink-0 text-muted" />
              <span className="flex-1 text-muted">Search or pick a category…</span>
            </>
          )}
          <FiChevronDown
            size={15}
            className={cn('shrink-0 text-muted transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {/* ── Dropdown panel ── */}
        <AnimatePresence>
          {dropdownOpen && (
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                  autoComplete="off"
                />
              </div>

              {/* Category grid inside dropdown */}
              <div className="max-h-56 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted">No categories found</div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {filtered.map((cat, i) => {
                      const Icon = (Icons[cat.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
                      const isSelected = value === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          type="button"
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.015, duration: 0.18 }}
                          onClick={() => handleSelect(cat)}
                          className={cn(
                            'relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 text-center transition-all duration-200 active:scale-95',
                            isSelected
                              ? 'border-primary bg-primary/8 shadow-soft'
                              : 'border-border bg-surface-2/60 hover:border-border/80 hover:bg-surface-2'
                          )}
                        >
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white"
                            >
                              <FiCheck size={10} strokeWidth={3} />
                            </motion.span>
                          )}
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <Icon size={15} />
                          </div>
                          <span className="max-w-full truncate text-sm font-medium text-foreground">
                            {cat.name}
                          </span>
                          <span className="max-w-full truncate text-[10px] uppercase text-muted">{cat.type}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Selected category badge (when closed) ── */}
      {selectedCategory && !dropdownOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 self-start rounded-full border border-border bg-surface-2 px-3 py-1.5"
        >
          {(() => {
            const Icon = (Icons[selectedCategory.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
            return (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md"
                style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
              >
                <Icon size={11} />
              </span>
            );
          })()}
          <span className="text-xs font-medium text-foreground">{selectedCategory.name}</span>
          <span className="font-mono text-[10px] text-primary">{selectedCategory.recordId}</span>
        </motion.div>
      )}
    </div>
  );
}
