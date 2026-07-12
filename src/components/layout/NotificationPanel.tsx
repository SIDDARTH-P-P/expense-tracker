'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiCheckCircle,
  FiGitBranch,
  FiDollarSign,
  FiAlertCircle,
  FiInfo,
  FiX,
} from 'react-icons/fi';
import { BottomSheet } from '@/components/common/BottomSheet';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils/cn';
import type { Notification } from '@/types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  isMarkingAllRead: boolean;
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'Split Created':
      return <FiGitBranch size={16} />;
    case 'Split Paid':
      return <FiCheckCircle size={16} />;
    case 'Split Reminder':
      return <FiAlertCircle size={16} />;
    case 'Expense':
      return <FiDollarSign size={16} />;
    case 'Income':
      return <FiDollarSign size={16} />;
    case 'System':
      return <FiInfo size={16} />;
    default:
      return <FiBell size={16} />;
  }
}

function getNotificationColor(type: Notification['type']) {
  switch (type) {
    case 'Split Created':
      return 'bg-primary/10 text-primary';
    case 'Split Paid':
      return 'bg-income/10 text-income';
    case 'Split Reminder':
      return 'bg-orange-500/10 text-orange-500';
    case 'Expense':
      return 'bg-expense/10 text-expense';
    case 'Income':
      return 'bg-income/10 text-income';
    case 'System':
      return 'bg-blue-500/10 text-blue-500';
    default:
      return 'bg-muted/10 text-muted';
  }
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  onMarkRead,
  onMarkAllRead,
  isMarkingAllRead,
}: NotificationPanelProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Notifications" showHeader={false}>
      {/* Custom header with mark all read */}
      <div className="mb-4">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-display font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-expense px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                disabled={isMarkingAllRead}
                className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
              >
                {isMarkingAllRead ? 'Marking...' : 'Mark all read'}
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-foreground"
            >
              <FiX />
            </button>
          </div>
        </div>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-surface-2"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={FiBell}
          title="No Notifications"
          description="You're all caught up! New notifications will appear here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {notifications.map((notification, index) => (
              <motion.button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (!notification.read) {
                    onMarkRead(notification.id);
                  }
                }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.15) }}
                className={cn(
                  'relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all',
                  notification.read
                    ? 'border-border bg-surface opacity-60 hover:opacity-80'
                    : 'border-primary/20 bg-primary/[0.03] shadow-soft hover:bg-primary/[0.06]'
                )}
              >
                {/* Unread indicator dot */}
                {!notification.read && (
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                    getNotificationColor(notification.type)
                  )}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-semibold leading-tight">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted leading-relaxed line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                        getNotificationColor(notification.type)
                      )}
                    >
                      {notification.type}
                    </span>
                    <span className="text-[10px] text-muted">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </BottomSheet>
  );
}
