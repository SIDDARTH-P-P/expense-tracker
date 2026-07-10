'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { FiSearch, FiCheck, FiChevronDown, FiX, FiCornerDownRight } from 'react-icons/fi';
import type { Category } from '@/types';
import { cn } from '@/lib/utils/cn';

interface QuickCategoryPickerProps {
  categories: Category[];
  value: string;
  subValue?: string | null;
  onChange: (id: string, subName?: string | null) => void;
  error?: string;
}

export function QuickCategoryPicker({ categories, value, subValue, onChange, error }: QuickCategoryPickerProps) {
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
    onChange(cat.id, null);
    setDropdownOpen(false);
    setSearch('');
  }

  function handleSelectSub(catId: string, subName: string) {
    onChange(catId, subName);
    setDropdownOpen(false);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('', null);
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
                <span className="truncate font-medium text-foreground">
                  {subValue ? `${selectedCategory.name} › ${subValue}` : selectedCategory.name}
                </span>
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

              {/* Category list inside dropdown */}
              <div className="max-h-64 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted">No categories found</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {filtered.map((cat) => {
                      const Icon = (Icons[cat.icon as keyof typeof Icons] ?? Icons.FiTag) as IconType;
                      const isCatSelected = value === cat.id && !subValue;
                      const hasSubs = cat.subcategories && cat.subcategories.length > 0;

                      return (
                        <div key={cat.id} className="flex flex-col gap-0.5">
                          {/* Parent category row */}
                          <button
                            type="button"
                            onClick={() => handleSelect(cat)}
                            className={cn(
                              'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors text-left',
                              isCatSelected
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-surface-2'
                            )}
                          >
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                            >
                              <Icon size={13} />
                            </span>
                            <span className="flex-1 truncate font-medium">{cat.name}</span>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase',
                                cat.type === 'income' ? 'bg-income/10 text-income'
                                  : cat.type === 'both' ? 'bg-warning/10 text-warning'
                                  : 'bg-expense/10 text-expense'
                              )}
                            >
                              {cat.type}
                            </span>
                            {isCatSelected && <FiCheck size={13} className="shrink-0 text-primary" />}
                          </button>

                          {/* Subcategory rows — indented */}
                          {hasSubs && (
                            <div className="ml-5 flex flex-col gap-0.5 border-l-2 border-border/40 pl-2">
                              {cat.subcategories.map((sub) => {
                                const isSubSelected = value === cat.id && subValue === sub.name;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => handleSelectSub(cat.id, sub.name)}
                                    className={cn(
                                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left',
                                      isSubSelected
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-muted hover:bg-surface-2 hover:text-foreground'
                                    )}
                                  >
                                    <FiCornerDownRight size={11} className="shrink-0 opacity-50" />
                                    <span className="flex-1 truncate">{sub.name}</span>
                                    {isSubSelected && <FiCheck size={11} className="shrink-0 text-primary" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
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
          <span className="text-xs font-medium text-foreground">
            {subValue ? `${selectedCategory.name} › ${subValue}` : selectedCategory.name}
          </span>
          <span className="font-mono text-[10px] text-primary">{selectedCategory.recordId}</span>
        </motion.div>
      )}
    </div>
  );
}
