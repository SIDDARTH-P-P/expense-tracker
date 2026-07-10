'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { FiArrowLeft, FiSearch, FiCheck, FiX, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { categorySchema, type CategoryFormValues } from '@/lib/validations/category.schema';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils/cn';
import type { Category } from '@/types';

/* ── Colour palette ── */
const SWATCHES: { hex: string; name: string }[] = [
  { hex: '#2DD4BF', name: 'Teal' },
  { hex: '#34D399', name: 'Emerald' },
  { hex: '#FB7185', name: 'Rose' },
  { hex: '#F5A623', name: 'Amber' },
  { hex: '#818CF8', name: 'Indigo' },
  { hex: '#F472B6', name: 'Pink' },
  { hex: '#38BDF8', name: 'Sky' },
  { hex: '#A78BFA', name: 'Violet' },
  { hex: '#10B981', name: 'Green' },
  { hex: '#06B6D4', name: 'Cyan' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#6366F1', name: 'Indigo‑600' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#EC4899', name: 'Fuchsia' },
  { hex: '#F43F5E', name: 'Red‑Rose' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#F59E0B', name: 'Yellow' },
  { hex: '#14B8A6', name: 'Teal‑500' },
  { hex: '#84CC16', name: 'Lime' },
  { hex: '#22C55E', name: 'Green‑500' },
  { hex: '#0EA5E9', name: 'Sky‑500' },
  { hex: '#A855F7', name: 'Purple‑500' },
  { hex: '#D946EF', name: 'Fuchsia‑500' },
];

/* ── Popular default icons ── */
const DEFAULT_ICONS = [
  'FiTag', 'FiCoffee', 'FiMapPin', 'FiHeart', 'FiFileText',
  'FiShoppingBag', 'FiTruck', 'FiFilm', 'FiHome', 'FiBook',
  'FiShoppingCart', 'FiBriefcase', 'FiTrendingUp', 'FiGift', 'FiAward',
];

/* ── All icons from react-icons/fi ── */
const ALL_ICONS = Object.keys(Icons).filter(
  (key) => key.startsWith('Fi') && typeof (Icons as Record<string, unknown>)[key] === 'function'
);

/* ── Humanise "FiShoppingCart" → "Shopping Cart" ── */
function humanise(iconKey: string) {
  return iconKey
    .replace(/^Fi/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

/* ─────────────────────── Icon Combobox ─────────────────────── */
function IconCombobox({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const SelectedIcon = (Icons[value as keyof typeof Icons] ?? Icons.FiTag) as IconType;

  const filtered = useMemo(() => {
    if (!query.trim()) return DEFAULT_ICONS;
    const q = query.toLowerCase().replace(/^fi/, '');
    return ALL_ICONS.filter((n) => n.toLowerCase().includes(q)).slice(0, 25);
  }, [query]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const select = useCallback(
    (iconName: string) => {
      onChange(iconName);
      setOpen(false);
      setQuery('');
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">Icon</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          'flex h-12 w-full items-center gap-2.5 rounded-2xl border bg-surface px-4 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
          error ? 'border-expense' : 'border-border',
          open && 'border-primary ring-2 ring-primary/20'
        )}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-surface-2 text-foreground">
          <SelectedIcon size={15} />
        </span>
        <span className="flex-1 truncate text-foreground">{humanise(value)}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange('FiTag'); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), onChange('FiTag'))}
            className="shrink-0 text-muted hover:text-foreground transition-colors"
            aria-label="Clear"
          >
            <FiX size={14} />
          </span>
        )}
        <FiChevronDown size={16} className={cn('shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <FiSearch size={14} className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                autoComplete="off"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-muted hover:text-foreground">
                  <FiX size={13} />
                </button>
              )}
            </div>

            {/* List */}
            <ul className="max-h-52 overflow-y-auto py-1.5">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-center text-sm text-muted">No results for &quot;{query}&quot;</li>
              ) : (
                filtered.map((iconName) => {
                  const Icon = (Icons[iconName as keyof typeof Icons] ?? Icons.FiTag) as IconType;
                  const selected = iconName === value;
                  return (
                    <li
                      key={iconName}
                      onClick={() => select(iconName)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-2'
                      )}
                    >
                      <span className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-xl',
                        selected ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted'
                      )}>
                        <Icon size={16} />
                      </span>
                      <span className="flex-1 truncate">{humanise(iconName)}</span>
                      {selected && <FiCheck size={14} className="shrink-0 text-primary" />}
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-expense">{error}</p>}
    </div>
  );
}

/* ─────────────────────── Colour Combobox ─────────────────────── */
function ColorCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = SWATCHES.find((s) => s.hex.toLowerCase() === value.toLowerCase());

  const filtered = useMemo(() => {
    if (!query.trim()) return SWATCHES;
    const q = query.toLowerCase();
    return SWATCHES.filter((s) => s.name.toLowerCase().includes(q) || s.hex.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">Color</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          'flex h-12 w-full items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
          open && 'border-primary ring-2 ring-primary/20'
        )}
      >
        <span
          className="h-6 w-6 shrink-0 rounded-full border border-black/10 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <span className="flex-1 truncate text-foreground">
          {selected ? selected.name : value}
        </span>
        <FiChevronDown size={16} className={cn('shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <FiSearch size={14} className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search colours…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                autoComplete="off"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-muted hover:text-foreground">
                  <FiX size={13} />
                </button>
              )}
            </div>

            {/* List */}
            <ul className="max-h-52 overflow-y-auto py-1.5">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-center text-sm text-muted">No results for &quot;{query}&quot;</li>
              ) : (
                filtered.map((swatch) => {
                  const isSelected = swatch.hex.toLowerCase() === value.toLowerCase();
                  return (
                    <li
                      key={swatch.hex}
                      onClick={() => { onChange(swatch.hex); setOpen(false); setQuery(''); }}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        isSelected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-2'
                      )}
                    >
                      <span
                        className="h-7 w-7 shrink-0 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <span className="flex-1">{swatch.name}</span>
                      <span className="font-mono text-xs text-muted">{swatch.hex}</span>
                      {isSelected && <FiCheck size={14} className="shrink-0 text-primary" />}
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────── Main Form ─────────────────────── */
interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (values: CategoryFormValues) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

const TYPES = [
  { value: 'expense' as const, label: 'Expense', activeClass: 'bg-expense text-expense-foreground' },
  { value: 'income' as const, label: 'Income', activeClass: 'bg-income text-income-foreground' },
  { value: 'both' as const, label: 'Both', activeClass: 'bg-warning text-foreground' },
];

export function CategoryForm({ initialData, onSubmit, isSubmitting, onCancel }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ?? { icon: 'FiTag', color: SWATCHES[0].hex, type: 'expense' },
  });

  const color = watch('color');
  const icon = watch('icon');
  const type = watch('type');

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface text-foreground">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:h-[74px] sm:px-5">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="grid h-10 w-10 shrink-0 place-items-center text-foreground sm:h-11 sm:w-11"
            aria-label="Back"
          >
            <FiArrowLeft size={26} strokeWidth={2.2} />
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
        <h2 className="min-w-0 flex-1 truncate px-2 text-center text-xl font-semibold leading-tight tracking-normal sm:px-4">
          {initialData ? 'Edit Category' : 'Add Category'}
        </h2>
        <div className="h-10 w-10" />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5 sm:px-5 sm:pb-28 sm:pt-6">
        <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <input type="hidden" {...register('icon')} />
          <input type="hidden" {...register('type')} />
          <input type="hidden" {...register('color')} />

          {/* Name */}
          <Input
            label="Category name"
            placeholder="e.g. Subscriptions"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Type toggle — 3 options */}
          <div>
            <p className="mb-2 text-sm font-medium">Type</p>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface-2 p-1.5">
              {TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setValue('type', item.value, { shouldDirty: true, shouldValidate: true })}
                  className={cn(
                    'h-10 rounded-xl text-sm font-bold transition',
                    type === item.value ? item.activeClass + ' shadow-sm' : 'text-muted hover:text-foreground'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {errors.type && <p className="mt-1.5 text-xs text-expense">{errors.type.message}</p>}
          </div>

          {/* Icon — combobox */}
          <IconCombobox
            value={icon}
            onChange={(v) => setValue('icon', v, { shouldDirty: true, shouldValidate: true })}
            error={errors.icon?.message}
          />

          {/* Color — combobox */}
          <ColorCombobox
            value={color}
            onChange={(v) => setValue('color', v, { shouldDirty: true, shouldValidate: true })}
          />
        </form>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-20 shrink-0 border-t border-border bg-surface px-4 py-3 sm:px-5 sm:py-4">
        <Button
          type="submit"
          form="category-form"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
        >
          {initialData ? 'Save changes' : 'Add category'}
        </Button>
      </div>
    </div>
  );
}
