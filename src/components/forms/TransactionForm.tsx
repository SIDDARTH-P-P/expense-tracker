'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiGrid,
  FiMic,
  FiSettings,
} from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import { transactionSchema, type TransactionFormValues } from '@/lib/validations/transaction.schema';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils/cn';
import type { Transaction } from '@/types';

type SubmitIntent = 'save' | 'saveAndNew';

interface TransactionFormProps {
  defaultType?: 'income' | 'expense';
  initialData?: Transaction;
  onSubmit: (values: TransactionFormValues, intent?: SubmitIntent) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

type PaymentMethod = TransactionFormValues['paymentMethod'];
type PickerType = 'date' | 'time' | null;
type TimeDial = 'hour' | 'minute';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DATE_WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const PRIMARY = 'hsl(var(--primary))';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDatetimeLocalString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDatetimeLocal(value?: string) {
  if (!value) return new Date();
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart?.split('-').map(Number) ?? [];
  const [hour, minute] = timePart?.split(':').map(Number) ?? [];
  if (![year, month, day, hour, minute].every((n) => Number.isFinite(n))) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  return new Date(year, month - 1, day, hour, minute);
}

function formatDateButton(date: Date) {
  return `${pad(date.getDate())} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTimeButton(date: Date) {
  const hour12 = date.getHours() % 12 || 12;
  return `${pad(hour12)}:${pad(date.getMinutes())} ${date.getHours() >= 12 ? 'pm' : 'am'}`;
}

function formatDateHeader(date: Date) {
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointForClock(value: number, total: number, radius: number) {
  const angle = (value / total) * Math.PI * 2;
  return {
    x: Math.sin(angle) * radius,
    y: -Math.cos(angle) * radius,
    degrees: (angle * 180) / Math.PI - 90,
  };
}

function PickerBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  );
}

function DatePickerDialog({
  value,
  onCancel,
  onConfirm,
}: {
  value: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
}) {
  const [draft, setDraft] = useState(() => new Date(value));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstMondayOffset = (new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() + 6) % 7;

  function selectDay(day: number) {
    const next = new Date(draft);
    next.setFullYear(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setDraft(next);
  }

  return (
    <PickerBackdrop>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Set date"
        initial={{ scale: 0.98, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: 12 }}
        className="w-full max-w-[330px] overflow-hidden rounded-lg bg-surface text-foreground shadow-2xl"
      >
        <div className="bg-primary px-5 pb-4 pt-4 text-primary-foreground sm:px-6">
          <p className="text-sm font-semibold opacity-80 sm:text-base">{draft.getFullYear()}</p>
          <p className="mt-1 text-[28px] font-medium leading-tight tracking-normal sm:text-[32px]">{formatDateHeader(draft)}</p>
        </div>

        <div className="px-4 pb-4 pt-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              className="grid h-9 w-9 place-items-center text-foreground"
              aria-label="Previous month"
            >
              <FiChevronLeft size={24} />
            </button>
            <p className="text-base font-semibold sm:text-lg">{MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</p>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              className="grid h-9 w-9 place-items-center text-foreground"
              aria-label="Next month"
            >
              <FiChevronRight size={24} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted sm:text-sm">
            {DATE_WEEKDAYS.map((day, index) => (
              <span key={`${day}-${index}`} className="h-7">{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-sm sm:text-base">
            {Array.from({ length: firstMondayOffset }).map((_, index) => (
              <span key={`blank-${index}`} className="h-8 sm:h-9" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const selected =
                day === draft.getDate() &&
                draft.getMonth() === calendarMonth.getMonth() &&
                draft.getFullYear() === calendarMonth.getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    'mx-auto grid h-8 w-8 place-items-center rounded-full text-sm transition sm:h-9 sm:w-9 sm:text-base',
                    selected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-surface-2'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-8 text-sm font-bold uppercase tracking-normal text-primary sm:text-base">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="button" onClick={() => onConfirm(draft)}>OK</button>
          </div>
        </div>
      </motion.div>
    </PickerBackdrop>
  );
}

function TimePickerDialog({
  value,
  onCancel,
  onConfirm,
}: {
  value: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
}) {
  const [draft, setDraft] = useState(() => new Date(value));
  const [dial, setDial] = useState<TimeDial>('hour');
  const [typed, setTyped] = useState(false);
  const [inputHour, setInputHour] = useState(() => pad(value.getHours()));
  const [inputMinute, setInputMinute] = useState(() => pad(value.getMinutes()));

  useEffect(() => {
    setInputHour(pad(draft.getHours()));
    setInputMinute(pad(draft.getMinutes()));
  }, [draft]);

  function setHour(hour: number) {
    const next = new Date(draft);
    next.setHours(hour);
    setDraft(next);
    setDial('minute');
  }

  function setMinute(minute: number) {
    const next = new Date(draft);
    next.setMinutes(minute);
    setDraft(next);
  }

  function confirmTyped() {
    const next = new Date(draft);
    next.setHours(clamp(Number(inputHour) || 0, 0, 23));
    next.setMinutes(clamp(Number(inputMinute) || 0, 0, 59));
    onConfirm(next);
  }

  return (
    <PickerBackdrop>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Set time"
        initial={{ scale: 0.98, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: 12 }}
        className="w-full max-w-[370px] overflow-hidden rounded-lg bg-surface text-foreground shadow-2xl"
      >
        <div className="bg-primary text-primary-foreground">
          {typed ? (
            <div className="px-6 py-7 sm:px-8 sm:py-8">
              <p className="text-[34px] font-semibold leading-tight tracking-normal sm:text-[42px]">Set time</p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-7 text-[56px] font-light leading-none tracking-normal sm:py-8 sm:text-[70px]">
              <button
                type="button"
                onClick={() => setDial('hour')}
                className={cn('tabular-nums', dial === 'hour' ? 'text-primary-foreground' : 'text-primary-foreground/55')}
              >
                {pad(draft.getHours())}
              </button>
              <span className="px-2 text-primary-foreground/70">:</span>
              <button
                type="button"
                onClick={() => setDial('minute')}
                className={cn('tabular-nums', dial === 'minute' ? 'text-primary-foreground' : 'text-primary-foreground/55')}
              >
                {pad(draft.getMinutes())}
              </button>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7">
          {typed ? (
            <div className="pb-6 sm:pb-8">
              <p className="mb-6 text-lg font-bold sm:mb-7 sm:text-xl">Type in time</p>
              <div className="flex items-start gap-4">
                <label className="w-16">
                  <input
                    value={inputHour}
                    onChange={(event) => setInputHour(event.target.value.replace(/\D/g, '').slice(0, 2))}
                    inputMode="numeric"
                    className="w-full border-b-2 border-muted bg-transparent pb-2 text-center text-[32px] font-light text-muted outline-none sm:text-[34px]"
                    aria-label="Hour"
                  />
                  <span className="mt-2 block text-center text-lg text-muted sm:text-xl">hour</span>
                </label>
                <span className="pt-1 text-[32px] text-muted sm:text-[34px]">:</span>
                <label className="w-20">
                  <input
                    value={inputMinute}
                    onChange={(event) => setInputMinute(event.target.value.replace(/\D/g, '').slice(0, 2))}
                    inputMode="numeric"
                    className="w-full border-b-2 border-muted bg-transparent pb-2 text-center text-[32px] font-light text-muted outline-none sm:text-[34px]"
                    aria-label="Minute"
                  />
                  <span className="mt-2 block text-center text-lg text-muted sm:text-xl">minute</span>
                </label>
              </div>
            </div>
          ) : (
            <ClockFace
              dial={dial}
              hour={draft.getHours()}
              minute={draft.getMinutes()}
              onHourChange={setHour}
              onMinuteChange={setMinute}
            />
          )}

          <div className="mt-5 flex items-center justify-between sm:mt-6">
            <button
              type="button"
              onClick={() => setTyped((value) => !value)}
              className="grid h-11 w-11 place-items-center text-muted"
              aria-label={typed ? 'Show clock picker' : 'Type time'}
            >
              {typed ? <FiClock size={30} /> : <FiGrid size={30} />}
            </button>
            <div className="flex gap-8 text-base font-bold uppercase tracking-normal text-primary sm:gap-10 sm:text-lg">
              <button type="button" onClick={onCancel}>Cancel</button>
              <button type="button" onClick={typed ? confirmTyped : () => onConfirm(draft)}>OK</button>
            </div>
          </div>
        </div>
      </motion.div>
    </PickerBackdrop>
  );
}

function ClockFace({
  dial,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: {
  dial: TimeDial;
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
}) {
  const selectedPoint =
    dial === 'hour'
      ? pointForClock(hour % 12, 12, hour === 0 || hour > 12 ? 64 : 100)
      : pointForClock(minute, 60, 100);
  const minuteIsOnLabel = minute % 5 === 0;

  return (
    <div className="relative mx-auto h-[248px] w-[248px] rounded-full bg-surface-2">
      <span className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
      <span
        className="absolute left-1/2 top-1/2 z-10 h-[3px] origin-left rounded-full"
        style={{
          width: `${selectedPoint.x || selectedPoint.y ? Math.hypot(selectedPoint.x, selectedPoint.y) - 24 : 0}px`,
          transform: `rotate(${selectedPoint.degrees}deg)`,
          backgroundColor: PRIMARY,
        }}
      />

      {dial === 'hour' ? (
        <>
          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((label) => (
            <ClockNumber
              key={`outer-${label}`}
              label={String(label)}
              value={label}
              total={12}
              radius={100}
              selected={hour === label}
              onSelect={() => onHourChange(label)}
            />
          ))}
          {[0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((label, index) => (
            <ClockNumber
              key={`inner-${label}`}
              label={label === 0 ? '00' : String(label)}
              value={index}
              total={12}
              radius={64}
              selected={hour === label}
              onSelect={() => onHourChange(label)}
              muted
            />
          ))}
        </>
      ) : (
        <>
          {Array.from({ length: 12 }).map((_, index) => {
            const label = index * 5;
            return (
              <ClockNumber
                key={`minute-${label}`}
                label={pad(label)}
                value={label}
                total={60}
                radius={100}
                selected={minute === label}
                onSelect={() => onMinuteChange(label)}
              />
            );
          })}
          {!minuteIsOnLabel && (
            <span
              className="absolute z-20 grid h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-base text-primary-foreground"
              style={{
                left: `calc(50% + ${selectedPoint.x}px)`,
                top: `calc(50% + ${selectedPoint.y}px)`,
              }}
            >
              :{pad(minute)}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function ClockNumber({
  label,
  value,
  total,
  radius,
  selected,
  muted,
  onSelect,
}: {
  label: string;
  value: number;
  total: number;
  radius: number;
  selected: boolean;
  muted?: boolean;
  onSelect: () => void;
}) {
  const point = pointForClock(value, total, radius);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'absolute z-20 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-lg transition',
        selected ? 'bg-primary text-primary-foreground' : muted ? 'text-muted hover:bg-surface' : 'text-foreground hover:bg-surface'
      )}
      style={{
        left: `calc(50% + ${point.x}px)`,
        top: `calc(50% + ${point.y}px)`,
      }}
    >
      {label}
    </button>
  );
}

function FieldShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'transaction-field relative h-14 rounded-[18px] border border-border/90 bg-surface transition-colors focus-within:border-primary sm:h-16',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TransactionForm({ defaultType = 'expense', initialData, onSubmit, isSubmitting, onCancel }: TransactionFormProps) {
  const { data: categories = [] } = useCategories();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [picker, setPicker] = useState<PickerType>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
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
          paymentMethod: 'cash',
          date: toDatetimeLocalString(new Date()),
          category: '',
        },
  });

  const type = watch('type');
  const paymentMethod = watch('paymentMethod');
  const currentDate = parseDatetimeLocal(watch('date'));
  const filteredCategories = categories.filter((category) => category.type === type || category.type === 'both');
  const isIncome = type === 'income';
  const isOnlinePayment = paymentMethod !== 'cash';
  const title = `${initialData ? 'Edit' : 'Add'} ${isIncome ? 'Income' : 'Expense'} Entry`;
  const accent = isIncome ? 'text-income' : 'text-expense';

  function handleTypeChange(newType: 'income' | 'expense') {
    setValue('type', newType, { shouldDirty: true, shouldValidate: true });
    setValue('category', '', { shouldDirty: true, shouldValidate: true });
  }

  function handlePaymentChange(method: PaymentMethod) {
    setValue('paymentMethod', method, { shouldDirty: true, shouldValidate: true });
  }

  function handleOnlineMode() {
    if (paymentMethod === 'cash') {
      handlePaymentChange('upi');
    }
  }

  function updateDateTime(date: Date) {
    setValue('date', toDatetimeLocalString(date), { shouldDirty: true, shouldValidate: true });
    setPicker(null);
  }

  function serializeValues(values: TransactionFormValues): TransactionFormValues {
    return {
      ...values,
      date: parseDatetimeLocal(values.date).toISOString(),
    };
  }

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(serializeValues(values), 'save'))}
      className="flex h-full min-h-0 flex-col bg-surface text-foreground"
    >
      <input type="hidden" {...register('type')} />
      <input type="hidden" {...register('paymentMethod')} />
      <input type="hidden" {...register('date')} />
      <input type="hidden" {...register('note')} />

      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:h-[74px] sm:px-5">
        <button type="button" onClick={onCancel} className="grid h-10 w-10 shrink-0 place-items-center text-foreground sm:h-11 sm:w-11" aria-label="Back">
          <FiArrowLeft size={28} strokeWidth={2.2} />
        </button>
        <h2 className={cn('min-w-0 flex-1 truncate px-2 text-center text-xl font-semibold leading-tight tracking-normal sm:px-4 sm:text-[28px]', accent)}>
          {title}
        </h2>
        <button type="button" className="grid h-10 w-10 shrink-0 place-items-center text-primary sm:h-11 sm:w-11" aria-label="Settings">
          <FiSettings size={28} strokeWidth={2.2} />
        </button>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-border bg-surface px-3 py-3 sm:gap-3 sm:px-5 sm:py-5">
        <button
          type="button"
          onClick={() => setPicker('date')}
          className="flex min-w-0 items-center gap-1.5 rounded-2xl border border-border/70 bg-surface-2/35 px-2.5 py-2 text-left transition hover:border-primary/60 sm:gap-3 sm:px-4 sm:py-3"
        >
          <FiCalendar size={21} className="shrink-0 text-muted sm:size-[30px]" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground min-[380px]:text-sm sm:text-[20px]">{formatDateButton(currentDate)}</span>
          <FiChevronDown size={16} className="shrink-0 text-muted sm:size-6" />
        </button>
        <button
          type="button"
          onClick={() => setPicker('time')}
          className="flex min-w-0 items-center justify-end gap-1.5 rounded-2xl border border-border/70 bg-surface-2/35 px-2.5 py-2 text-left transition hover:border-primary/60 sm:gap-3 sm:px-4 sm:py-3"
        >
          <FiClock size={22} className="shrink-0 text-muted sm:size-8" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground min-[380px]:text-sm sm:text-[20px]">{formatTimeButton(currentDate)}</span>
          <FiChevronDown size={16} className="shrink-0 text-muted sm:size-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-24 pt-5 sm:px-5 sm:pb-28 sm:pt-10">
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1.5 sm:mb-6 sm:gap-3 sm:rounded-full">
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={cn(
              'h-10 rounded-xl text-sm font-bold transition sm:h-11 sm:rounded-full sm:text-base',
              isIncome ? 'bg-income text-income-foreground shadow-sm' : 'text-muted hover:text-foreground'
            )}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={cn(
              'h-10 rounded-xl text-sm font-bold transition sm:h-11 sm:rounded-full sm:text-base',
              !isIncome ? 'bg-expense text-expense-foreground shadow-sm' : 'text-muted hover:text-foreground'
            )}
          >
            Expense
          </button>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div>
            <FieldShell className={errors.amount ? 'border-expense focus-within:border-expense' : undefined}>
              <label className="pointer-events-none absolute left-5 top-2 text-xs leading-none text-muted sm:left-8 sm:text-sm">
                Amount <span className="font-bold text-expense">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                placeholder="0"
                className={cn('h-full w-full bg-transparent px-5 pb-1 pt-5 text-xl font-bold outline-none placeholder:text-muted sm:px-8 sm:pt-6 sm:text-[24px]', accent)}
                {...register('amount', { setValueAs: (value) => (value === '' ? 0 : Number(value)) })}
              />
            </FieldShell>
            {errors.amount && <p className="mt-2 text-sm font-medium text-expense">{errors.amount.message}</p>}
          </div>

          <FieldShell>
            <button type="button" className="flex h-full w-full items-center justify-between px-5 text-left sm:px-8">
              <span className="truncate text-lg font-light text-muted sm:text-[24px]">Party (Customer/Supplier)</span>
              <FiChevronDown size={22} className="shrink-0 text-muted sm:size-6" />
            </button>
          </FieldShell>

          <div>
            <FieldShell className={errors.title ? 'border-expense focus-within:border-expense' : undefined}>
              <input
                type="text"
                placeholder="Remark"
                className="h-full w-full bg-transparent px-5 pr-14 text-lg font-light text-foreground outline-none placeholder:text-muted sm:px-8 sm:pr-16 sm:text-[24px]"
                {...register('title')}
              />
              <FiMic size={28} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-primary sm:right-7 sm:size-8" />
            </FieldShell>
            {errors.title && <p className="mt-2 text-sm font-medium text-expense">{errors.title.message}</p>}
          </div>

          <div>
            <label
              htmlFor="proof-upload"
              className="flex min-h-[116px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-2/40 px-4 py-4 text-center transition hover:border-primary hover:bg-surface-2/70"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <FiFileText size={17} />
              </span>
              <span className="text-sm font-bold text-foreground">Choose a file or document</span>
              <span className="text-[11px] font-semibold text-muted">JPEG, PNG, and PDF up to 50 MB.</span>
              <span className="mt-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                Browse File
              </span>
            </label>
            <input
              id="proof-upload"
              ref={proofInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
            />
            {proofFile && <p className="mt-2 truncate text-sm font-medium text-muted">{proofFile.name}</p>}
          </div>

          <div>
            <FieldShell className={errors.category ? 'border-expense focus-within:border-expense' : undefined}>
              <select
                className="h-full w-full appearance-none bg-transparent px-5 pr-12 text-lg font-light text-foreground outline-none disabled:text-muted sm:px-8 sm:pr-14 sm:text-[24px]"
                {...register('category')}
              >
                <option value="">Category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FiChevronDown size={22} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-muted sm:right-8 sm:size-6" />
            </FieldShell>
            {errors.category && <p className="mt-2 text-sm font-medium text-expense">{errors.category.message}</p>}
          </div>

          <div>
            <p className="mb-3 text-lg font-bold text-muted sm:mb-4 sm:text-[22px]">Payment Mode</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <PaymentPill active={paymentMethod === 'cash'} onClick={() => handlePaymentChange('cash')}>
                Cash
              </PaymentPill>
              <PaymentPill active={isOnlinePayment} muted onClick={handleOnlineMode}>
                Online
              </PaymentPill>
            </div>

            <AnimatePresence>
              {isOnlinePayment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {([
                      ['upi', 'UPI'],
                      ['card', 'Card'],
                      ['bank_transfer', 'Bank'],
                    ] as const).map(([method, label]) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => handlePaymentChange(method)}
                        className={cn(
                          'inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition sm:text-sm',
                          paymentMethod === method
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-surface text-foreground'
                        )}
                      >
                        {paymentMethod === method && <FiCheck size={14} />}
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {errors.paymentMethod && <p className="mt-2 text-sm font-medium text-expense">{errors.paymentMethod.message}</p>}
          </div>

          <button
            type="button"
            className="min-h-12 rounded-2xl border border-border bg-surface px-4 text-sm font-bold uppercase tracking-[0.08em] text-primary sm:h-[58px] sm:rounded-[6px] sm:px-7 sm:text-[22px] sm:tracking-[0.12em]"
          >
            Add More Fields
          </button>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(88px,0.55fr)] gap-3 border-t border-border bg-surface px-3 py-3 sm:grid-cols-[1fr_0.58fr] sm:gap-5 sm:px-5 sm:py-5">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit((values) => onSubmit(serializeValues(values), 'saveAndNew'))}
          className="h-12 min-w-0 rounded-xl border-2 border-primary bg-surface px-2 text-xs font-bold uppercase tracking-[0.08em] text-primary disabled:opacity-60 sm:h-[62px] sm:rounded-[6px] sm:text-[20px] sm:tracking-[0.16em]"
        >
          <span className="sm:hidden">Save & Add</span>
          <span className="hidden sm:inline">Save & Add New</span>
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 min-w-0 rounded-xl bg-primary px-2 text-sm font-bold uppercase tracking-[0.08em] text-primary-foreground disabled:opacity-60 sm:h-[62px] sm:rounded-[6px] sm:text-[20px] sm:tracking-[0.16em]"
        >
          {isSubmitting ? 'Saving' : 'Save'}
        </button>
      </div>

      <AnimatePresence>
        {picker === 'date' && (
          <DatePickerDialog
            value={currentDate}
            onCancel={() => setPicker(null)}
            onConfirm={updateDateTime}
          />
        )}
        {picker === 'time' && (
          <TimePickerDialog
            value={currentDate}
            onCancel={() => setPicker(null)}
            onConfirm={updateDateTime}
          />
        )}
      </AnimatePresence>
    </form>
  );
}

function PaymentPill({
  active,
  muted,
  onClick,
  children,
}: {
  active: boolean;
  muted?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 rounded-full px-5 text-base font-bold transition sm:h-12 sm:px-8 sm:text-[20px]',
        active ? 'bg-primary text-primary-foreground' : muted ? 'bg-surface-2 text-foreground' : 'bg-surface-2 text-foreground'
      )}
    >
      {children}
    </button>
  );
}
