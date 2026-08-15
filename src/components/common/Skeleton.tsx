import React from 'react';
import { cn } from '@/lib/utils/cn';
import { useTheme } from '@/hooks/useTheme';

export function Skeleton({ className, isDark: propIsDark }: { className?: string; isDark?: boolean }) {
  const { theme } = useTheme();
  const isDark = propIsDark ?? theme === 'dark';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl transition-colors',
        isDark
          ? 'bg-[#1e1e2d]/60 border border-white/5 before:via-white/10'
          : 'bg-slate-200/80 border border-slate-300/40 before:via-slate-300/40',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:to-transparent',
        className
      )}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14141f]/80 p-5 backdrop-blur-xl shadow-soft space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-10 w-44 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#181826]/70 p-3.5 backdrop-blur-md shadow-xs">
      <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-1/3 rounded-md" />
        <Skeleton className="h-2.5 w-1/4 rounded-md" />
      </div>
      <Skeleton className="h-5 w-20 rounded-lg shrink-0" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-xl flex flex-col gap-4 pt-3 animate-fade-in">
      {/* Hero Balance Card Skeleton */}
      <div className="rounded-[26px] border border-slate-200 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-[#181828] dark:via-[#141420] dark:to-[#0d0d16] p-5 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-11 w-52 rounded-2xl" />
          <Skeleton className="h-3.5 w-36 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
            <Skeleton className="h-3 w-16 rounded-md bg-emerald-500/20" />
            <Skeleton className="h-6 w-24 rounded-lg bg-emerald-500/20" />
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
            <Skeleton className="h-3 w-16 rounded-md bg-rose-500/20" />
            <Skeleton className="h-6 w-24 rounded-lg bg-rose-500/20" />
          </div>
        </div>
      </div>

      {/* Recent Transactions Header Skeleton */}
      <div className="flex items-center justify-between px-1 pt-1">
        <Skeleton className="h-5 w-36 rounded-md" />
        <Skeleton className="h-4 w-14 rounded-md" />
      </div>

      {/* Recent Transaction Rows Skeleton */}
      <div className="flex flex-col gap-2.5">
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
        <TransactionRowSkeleton />
      </div>
    </div>
  );
}

export function ChatMessagesSkeleton({ isDark: propIsDark }: { isDark?: boolean } = {}) {
  const { theme } = useTheme();
  const isDark = propIsDark ?? theme === 'dark';

  return (
    <div className="flex flex-col gap-3.5 p-2 animate-fade-in">
      {/* Date Header Pill */}
      <div className="mx-auto my-1">
        <Skeleton className={`h-5 w-24 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
      </div>

      {/* Incoming Bot Message */}
      <div className="flex justify-start">
        <div className={`max-w-[78%] rounded-[20px] rounded-tl-sm p-3.5 border shadow-sm space-y-2 ${
          isDark ? 'bg-[#1e1e2c]/90 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <Skeleton className={`h-3.5 w-24 rounded-md ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`} isDark={isDark} />
          <Skeleton className={`h-3 w-56 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          <Skeleton className={`h-3 w-40 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          <div className="flex justify-end pt-1">
            <Skeleton className={`h-2.5 w-10 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          </div>
        </div>
      </div>

      {/* Outgoing User Message */}
      <div className="flex justify-end">
        <div className={`max-w-[75%] rounded-[20px] rounded-tr-sm p-3.5 border shadow-sm space-y-2 ${
          isDark
            ? 'bg-gradient-to-r from-[#9d4edd]/30 to-[#7b2cbf]/30 border-[#9d4edd]/40'
            : 'bg-purple-100/90 border-purple-200'
        }`}>
          <Skeleton className={`h-3.5 w-44 rounded-md ${isDark ? 'bg-white/20' : 'bg-purple-200/80'}`} isDark={isDark} />
          <div className="flex justify-end pt-1 gap-1">
            <Skeleton className={`h-2.5 w-10 rounded-md ${isDark ? 'bg-white/20' : 'bg-purple-200/80'}`} isDark={isDark} />
            <Skeleton className={`h-2.5 w-3 rounded-md ${isDark ? 'bg-white/20' : 'bg-purple-200/80'}`} isDark={isDark} />
          </div>
        </div>
      </div>

      {/* Incoming Voice Note Skeleton */}
      <div className="flex justify-start">
        <div className={`max-w-[80%] rounded-[22px] rounded-tl-sm p-3 border shadow-sm space-y-2 ${
          isDark ? 'bg-[#1e1e2c]/90 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <Skeleton className={`h-3 w-28 rounded-md ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`} isDark={isDark} />
          <div className="flex items-center gap-3">
            <Skeleton className={`h-9 w-9 rounded-full shrink-0 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
            <Skeleton className={`h-3 w-36 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          </div>
          <div className="flex justify-end pt-0.5">
            <Skeleton className={`h-2.5 w-10 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          </div>
        </div>
      </div>

      {/* Outgoing Image Skeleton */}
      <div className="flex justify-end">
        <div className={`max-w-[70%] rounded-[20px] rounded-tr-sm p-2 border shadow-sm space-y-2 ${
          isDark ? 'bg-[#1e1e2c]/90 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <Skeleton className={`h-36 w-full rounded-xl ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          <div className="flex justify-end pt-0.5 gap-1">
            <Skeleton className={`h-2.5 w-10 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
            <Skeleton className={`h-2.5 w-3 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton({ isDark: propIsDark }: { isDark?: boolean } = {}) {
  const { theme } = useTheme();
  const isDark = propIsDark ?? theme === 'dark';

  return (
    <div className="mx-auto w-full max-w-lg p-4 space-y-6 animate-fade-in">
      {/* Header & Avatar Skeleton */}
      <div className="flex items-center gap-4 pt-4 pb-2">
        <Skeleton className={`h-20 w-20 rounded-full shrink-0 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
        <div className="flex-1 space-y-2.5">
          <Skeleton className={`h-5 w-40 rounded-lg ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          <Skeleton className={`h-3.5 w-28 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          <Skeleton className={`h-3 w-20 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
        </div>
      </div>

      {/* Profile Details Card Skeleton */}
      <div className={`rounded-3xl border p-5 space-y-4 shadow-soft ${
        isDark ? 'bg-[#14141f]/80 border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <Skeleton className={`h-4 w-32 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          <Skeleton className={`h-4 w-12 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Skeleton className={`h-3.5 w-24 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
            <Skeleton className={`h-3.5 w-36 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className={`h-3.5 w-20 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
            <Skeleton className={`h-3.5 w-28 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          </div>
        </div>
      </div>

      {/* Active Sessions Section Skeleton */}
      <div className="space-y-3">
        <Skeleton className={`h-4 w-36 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
        <div className={`flex items-center gap-3.5 rounded-2xl border p-4 ${
          isDark ? 'bg-[#181826]/70 border-white/5' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <Skeleton className={`h-10 w-10 rounded-xl shrink-0 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          <div className="flex-1 space-y-2">
            <Skeleton className={`h-3.5 w-44 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
            <Skeleton className={`h-2.5 w-28 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          </div>
        </div>
        <div className={`flex items-center gap-3.5 rounded-2xl border p-4 ${
          isDark ? 'bg-[#181826]/70 border-white/5' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <Skeleton className={`h-10 w-10 rounded-xl shrink-0 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          <div className="flex-1 space-y-2">
            <Skeleton className={`h-3.5 w-36 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
            <Skeleton className={`h-2.5 w-24 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
}
