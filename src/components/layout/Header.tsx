'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiMoon, FiSun, FiSettings } from 'react-icons/fi';
import { useCurrentUser } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/common/Avatar';
import { Skeleton } from '@/components/common/Skeleton';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 👋';
  return 'Good evening 🌙';
}

export function Header() {
  const { data: user, isLoading } = useCurrentUser();
  
  // Get date range filter state from Zustand
  const dateFilterType = useUIStore((s) => s.dateFilterType);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const selectedYear = useUIStore((s) => s.selectedYear);

  // Compute from & to date strings based on filters
  const dateParams = useMemo(() => {
    if (dateFilterType === 'all') return { from: undefined, to: undefined };
    if (dateFilterType === 'month') {
      const from = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const to = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { from, to };
    }
    // year
    return {
      from: `${selectedYear}-01-01`,
      to: `${selectedYear}-12-31`,
    };
  }, [dateFilterType, selectedMonth, selectedYear]);

  // Fetch summary filtered by date range
  const { data: summary } = useDashboardSummary(dateParams.from, dateParams.to);
  const { theme, toggleTheme } = useTheme();
  
  const {
    notifications,
    unreadCount,
    isLoading: notifLoading,
    markRead,
    markAllRead,
    isMarkingAllRead,
  } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 w-full border-b border-border/60 bg-background"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Left — greeting + name */}
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <>
                <Skeleton className="h-3.5 w-24 mb-1" />
                <Skeleton className="h-5 w-36" />
              </>
            ) : (
              <>
                <p className="text-xs text-muted leading-none mb-0.5">{greeting()}</p>
                <h1 className="font-display text-base font-bold truncate leading-tight">
                  {user?.name ?? 'there'}
                </h1>
              </>
            )}
          </div>

          {/* Center — balance pill (hidden on very small screens) */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 shadow-soft"
            >
              <span className="text-xs text-muted font-medium">Balance</span>
              <span className={`font-display text-sm font-bold ${summary.totalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                <AnimatedNumber value={summary.totalBalance} currency={user?.currency ?? 'USD'} />
              </span>
            </motion.div>
          )}

          {/* Right — actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:scale-105 active:scale-95"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>

            <button
              onClick={() => setShowNotifications(true)}
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:scale-105 active:scale-95"
            >
              <FiBell size={16} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-expense px-1 text-[9px] font-bold text-white ring-2 ring-background"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </button>

            <Link
              href="/settings"
              aria-label="Settings"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:scale-105 active:scale-95"
            >
              <FiSettings size={16} />
            </Link>

            <Link href="/profile" aria-label="Profile" className="ml-1">
              <Avatar
                name={user?.name ?? 'U'}
                src={user?.avatar}
                size={36}
                className="ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
              />
            </Link>
          </div>
        </div>

        {/* Mobile balance bar */}
        {summary && (
          <div className="sm:hidden flex items-center justify-between px-4 pb-3 pt-0">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted">Net balance</span>
            </div>
            <span className={`font-display text-sm font-bold ${summary.totalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
              <AnimatedNumber value={summary.totalBalance} currency={user?.currency ?? 'USD'} />
            </span>
          </div>
        )}
      </header>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={notifLoading}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        isMarkingAllRead={isMarkingAllRead}
      />
    </>
  );
}
