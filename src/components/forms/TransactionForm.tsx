'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCalendar, FiChevronDown, FiFileText } from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import { transactionSchema, type TransactionFormValues } from '@/lib/validations/transaction.schema';
import { Input } from '@/components/common/Input';
import { Combobox } from '@/components/common/Combobox';
import { Button } from '@/components/common/Button';
import { QuickCategoryPicker } from './QuickCategoryPicker';
import { useCategories } from '@/hooks/useCategories';
import type { Transaction } from '@/types';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDatetimeLocalString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDatetimeLocal(value: string) {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart?.split('-').map(Number) ?? [];
  const [hour, minute] = timePart?.split(':').map(Number) ?? [];
  if (![year, month, day, hour, minute].every((n) => Number.isFinite(n))) {
    return new Date();
  }
  return new Date(year, month - 1, day, hour, minute);
}

const TIME_LABELS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

function DateTimePicker({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const current = parseDatetimeLocal(value);
  const [calendarMonth, setCalendarMonth] = useState(new Date(current.getFullYear(), current.getMonth(), 1));
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCalendarMonth(new Date(current.getFullYear(), current.getMonth(), 1));
  }, [current]);

  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const selectedDay = current.getDate();
  const selectedHour = current.getHours();
  const selectedMinute = current.getMinutes();
  const isPm = selectedHour >= 12;
  const selectedHour12 = selectedHour % 12 || 12;

  function updateDate(date: Date) {
    onChange(toDatetimeLocalString(date));
  }

  function selectDay(day: number) {
    const next = new Date(current);
    next.setFullYear(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    updateDate(next);
  }

  function selectHour(hour12: number) {
    const next = new Date(current);
    const hour = hour12 === 12 ? (isPm ? 12 : 0) : hour12 + (isPm ? 12 : 0);
    next.setHours(hour);
    updateDate(next);
  }

  function selectMinute(minute: number) {
    const next = new Date(current);
    next.setMinutes(minute);
    updateDate(next);
  }

  function toggleAmPm() {
    const next = new Date(current);
    next.setHours((selectedHour + 12) % 24);
    updateDate(next);
  }

  const formattedDate = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = `${selectedHour12}:${pad(selectedMinute)} ${isPm ? 'PM' : 'AM'}`;

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition hover:border-border/80"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FiCalendar size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Date & time</p>
            <p className="truncate text-sm text-muted">{formattedDate} · {formattedTime}</p>
          </div>
        </div>
        <FiChevronDown className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.14)]"
          >
            <div className="space-y-4 p-4">
              <div className="rounded-3xl border border-border bg-background/80 p-3">
                <div className="mb-3 flex items-center justify-between text-sm font-semibold text-foreground">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                    className="rounded-full border border-border bg-surface px-2 py-1 text-muted hover:text-foreground"
                  >
                    ‹
                  </button>
                  <span>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                    className="rounded-full border border-border bg-surface px-2 py-1 text-muted hover:text-foreground"
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 pt-2 text-sm">
                  {Array.from({ length: firstWeekday }).map((_, index) => (
                    <span key={`blank-${index}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const isSelected =
                      day === selectedDay &&
                      current.getMonth() === calendarMonth.getMonth() &&
                      current.getFullYear() === calendarMonth.getFullYear();
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => selectDay(day)}
                        className={`rounded-2xl px-2 py-2 text-sm transition ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'bg-surface hover:bg-surface-2 text-foreground'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background/80 p-3">
                <div className="mb-3 flex items-center justify-between text-sm font-semibold text-foreground">
                  <span>Time</span>
                  <button
                    type="button"
                    onClick={toggleAmPm}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-surface-2"
                  >
                    {isPm ? 'PM' : 'AM'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-2xl border border-border bg-surface px-3 py-3 text-center">
                    <p className="text-xs text-muted">Hour</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{selectedHour12}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface px-3 py-3 text-center">
                    <p className="text-xs text-muted">Minute</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{pad(selectedMinute)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface px-3 py-3 text-center">
                    <p className="text-xs text-muted">Period</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{isPm ? 'PM' : 'AM'}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
                  {TIME_LABELS.map((label) => {
                    const hour = label === '12' ? 12 : Number(label);
                    const isActive = hour === selectedHour12;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => selectHour(hour)}
                        className={`rounded-2xl border px-2 py-2 transition ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface text-foreground hover:border-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                  {[0, 15, 30, 45].map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => selectMinute(minute)}
                      className={`rounded-2xl border px-2 py-2 transition ${
                        selectedMinute === minute
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface text-foreground hover:border-foreground'
                      }`}
                    >
                      {pad(minute)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-xs text-expense">{error}</p>}
    </div>
  );
}

interface TransactionFormProps {
  defaultType?: 'income' | 'expense';
  initialData?: Transaction;
  onSubmit: (values: TransactionFormValues) => void;
  isSubmitting?: boolean;
}

const PAYMENT_METHODS = [
  { value: 'card', label: '💳 Card' },
  { value: 'cash', label: '💵 Cash' },
  { value: 'upi', label: '📱 UPI' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'other', label: '🔗 Other' },
];

export function TransactionForm({ defaultType = 'expense', initialData, onSubmit, isSubmitting }: TransactionFormProps) {
  const { data: categories = [] } = useCategories();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          amount: initialData.amount,
          type: initialData.type,
          category: typeof initialData.category === 'string' ? initialData.category : initialData.category.id,
          paymentMethod: initialData.paymentMethod,
          date: toDatetimeLocalString(new Date(initialData.date)),
          note: initialData.note,
        }
      : {
          type: defaultType,
          paymentMethod: 'card',
          date: toDatetimeLocalString(new Date()),
          category: '',
        },
  });

  const type = watch('type');
  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  function handleTypeChange(newType: 'income' | 'expense') {
    setValue('type', newType);
    setValue('category', '');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-h-0 flex flex-1 flex-col">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1.5">
        {(['expense', 'income'] as const).map((t) => (
          <motion.button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            whileTap={{ scale: 0.97 }}
            className={`rounded-xl py-3 text-sm font-bold capitalize transition-all duration-200 ${
              type === t
                ? t === 'income'
                  ? 'bg-income text-income-foreground shadow-soft'
                  : 'bg-expense text-expense-foreground shadow-soft'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {t === 'income' ? '💰 Income' : '💸 Expense'}
          </motion.button>
        ))}
      </div>

      {/* Amount — most prominent */}
      <div className="rounded-2xl border-2 border-dashed border-border bg-surface-2/50 px-4 py-4 text-center">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted">Amount</label>
        <div className="relative mt-2 flex items-center justify-center">
          <span className={`font-display text-2xl font-bold mr-1 ${type === 'income' ? 'text-income' : 'text-expense'}`}>
            {type === 'income' ? '+' : '−'}
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className={`font-display text-4xl font-extrabold bg-transparent text-center w-full focus:outline-none placeholder:text-muted ${
              type === 'income' ? 'text-income' : 'text-expense'
            }`}
            {...register('amount', { valueAsNumber: true })}
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-xs font-medium text-expense">{errors.amount.message}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 pt-4">
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <Input
              label="Description"
              placeholder="e.g. Grocery run, Netflix..."
              leftIcon={<FiFileText size={15} />}
              error={errors.title?.message}
              {...register('title')}
            />
            <div className="mt-4">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <QuickCategoryPicker
                    categories={filteredCategories}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.category?.message}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <Combobox
                    label="Payment method"
                    options={PAYMENT_METHODS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select method…"
                    error={errors.paymentMethod?.message}
                  />
                )}
              />
            </div>
            <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
              <DateTimePicker
                value={watch('date')}
                onChange={(value) => setValue('date', value, { shouldValidate: true })}
                error={errors.date?.message}
              />
              <input type="hidden" {...register('date')} />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Upload proof</p>
                <p className="text-xs text-muted">Receipt image, invoice, or bill (optional)</p>
              </div>
              <label
                htmlFor="proof-upload"
                className="inline-flex cursor-pointer items-center rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
              >
                Choose file
              </label>
            </div>
            <input
              id="proof-upload"
              ref={proofInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-3 truncate text-sm text-muted">{proofFile?.name ?? 'No file selected'}</p>
            {proofFile && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface-2">
                <p className="px-3 py-2 text-xs font-medium text-muted">Selected proof</p>
                <div className="px-3 pb-3">
                  <p className="truncate text-sm text-foreground">{proofFile.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <label htmlFor="note" className="text-sm font-medium text-foreground">
              Note <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="note"
              rows={4}
              placeholder="Add a note..."
              className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register('note')}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 z-10 mt-4 border-t border-border bg-surface/95 pt-4 backdrop-blur-sm">
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            size="lg"
            className="w-full font-bold"
            isLoading={isSubmitting}
          >
            {initialData ? 'Save Changes' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
          </Button>
        </motion.div>
      </div>
    </form>
  );
}
