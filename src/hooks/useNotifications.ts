'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient, ApiClientError } from '@/services/api-client';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import type { Notification } from '@/types';

// ——————————————————————————————————————————————————————
// Programmatic notification chime via Web Audio API
// ——————————————————————————————————————————————————————
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/**
 * Plays a pleasant two-tone chime (like a notification ding).
 * Uses the Web Audio API so no audio file is needed.
 */
export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if it was suspended (autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Create a gain node for volume envelope
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  // First tone — C6 (1047 Hz)
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1047, now);
  osc1.connect(gain);
  osc1.start(now);
  osc1.stop(now + 0.3);

  // Second tone — E6 (1319 Hz), slight delay for a pleasant two-tone chime
  const gain2 = ctx.createGain();
  gain2.connect(ctx.destination);
  gain2.gain.setValueAtTime(0, now + 0.12);
  gain2.gain.linearRampToValueAtTime(0.25, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1319, now + 0.12);
  osc2.connect(gain2);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.7);
}

// ——————————————————————————————————————————————————————
// Browser Push Notification (native OS-level)
// ——————————————————————————————————————————————————————
function requestNotificationPermission() {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (window.Notification.permission === 'default') {
    window.Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string, icon?: string) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;

  try {
    const notification = new window.Notification(title, {
      body,
      icon: icon ?? '/manifest.json', // fallback
      badge: '/manifest.json',
      tag: `ledgerly-${Date.now()}`,
      requireInteraction: false,
      silent: true, // we play our own sound
    });

    // Focus the tab when user clicks the native notification
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 6 seconds
    setTimeout(() => notification.close(), 6000);
  } catch {
    // Notification constructor may fail in some contexts (e.g., insecure origins)
  }
}

// ——————————————————————————————————————————————————————
// Notification query keys
// ——————————————————————————————————————————————————————
function notificationsQueryKey(userId?: string | null) {
  return ['notifications', userId ?? 'guest'] as const;
}

// ——————————————————————————————————————————————————————
// Query keys from other modules that should be invalidated
// on relevant notifications (real-time list refresh)
// ——————————————————————————————————————————————————————
const SPLIT_NOTIFICATION_TYPES = new Set([
  'Split Created',
  'Split Paid',
  'Split Reminder',
]);

function invalidateRelatedQueries(
  qc: ReturnType<typeof useQueryClient>,
  notificationType: string
) {
  if (SPLIT_NOTIFICATION_TYPES.has(notificationType)) {
    // Invalidate splits list so SplitList auto-refreshes
    qc.invalidateQueries({ queryKey: ['splits'] });
    // Invalidate transactions (splits create transactions)
    qc.invalidateQueries({ queryKey: ['transactions'] });
    // Invalidate dashboard summary (balance changes)
    qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
  }

  if (notificationType === 'Expense' || notificationType === 'Income') {
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
  }
}

// ——————————————————————————————————————————————————————
// Main hook
// ——————————————————————————————————————————————————————
export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Fetch initial notifications list
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: notificationsQueryKey(userId),
    queryFn: () => apiClient.get<Notification[]>('/notifications'),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  // Compute initial unread count from fetched data
  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // ——————————————————————————————————————————————————————
  // SSE connection for real-time updates
  // ——————————————————————————————————————————————————————
  useEffect(() => {
    if (!userId) return;

    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let retryCount = 0;
    const maxRetries = 5;

    function connect() {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource('/api/notifications/sse?t=' + Date.now());
      eventSourceRef.current = es;

      es.addEventListener('notification', (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);

          // 1. Add to notification cache (real-time list update)
          qc.setQueryData<Notification[]>(
            notificationsQueryKey(userId),
            (prev = []) => [notification, ...prev]
          );

          // 2. Update unread count
          setUnreadCount((prev) => prev + 1);

          // 3. Invalidate related queries (splits list, transactions, dashboard)
          invalidateRelatedQueries(qc, notification.type);

          // 4. Play notification sound
          playNotificationSound();

          // 5. Show in-app toast notification
          toast(notification.title, {
            icon: '🔔',
            duration: 4000,
            style: {
              borderRadius: '16px',
              background: 'var(--color-surface)',
              color: 'var(--color-foreground)',
              border: '1px solid var(--color-border)',
            },
          });

          // 6. Show native browser push notification
          //    (works even when tab is in background / minimized)
          showBrowserNotification(
            notification.title,
            notification.message
          );
        } catch {
          // ignore malformed messages
        }
      });

      es.addEventListener('unread_count', (event) => {
        try {
          const { count } = JSON.parse(event.data);
          setUnreadCount(count);
        } catch {
          // ignore
        }
      });

      es.addEventListener('settings_update', (event) => {
        try {
          const settings = JSON.parse(event.data);
          if (settings.theme) {
            const currentTheme = useUIStore.getState().theme;
            if (currentTheme !== settings.theme) {
              useUIStore.getState().setTheme(settings.theme);
            }
            qc.invalidateQueries({ queryKey: ['auth', 'me'] });
          }
          if (settings.currency) {
            qc.invalidateQueries({ queryKey: ['auth', 'me'] });
            qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
            qc.invalidateQueries({ queryKey: ['transactions'] });
            qc.invalidateQueries({ queryKey: ['splits'] });
          }
        } catch {
          // ignore
        }
      });

      es.addEventListener('open', () => {
        retryCount = 0; // reset retries on successful connect
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          reconnectTimeout = setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [userId, qc]);

  // Mark single notification as read
  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<Notification>(`/notifications/${id}`, {}),
    onSuccess: (updated) => {
      qc.setQueryData<Notification[]>(
        notificationsQueryKey(userId),
        (prev = []) =>
          prev.map((n) => (n.id === updated.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });

  // Mark all notifications as read
  const markAllRead = useMutation({
    mutationFn: () => apiClient.post('/notifications', {}),
    onSuccess: () => {
      qc.setQueryData<Notification[]>(
        notificationsQueryKey(userId),
        (prev = []) => prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markRead: useCallback(
      (id: string) => markRead.mutate(id),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [markRead.mutate]
    ),
    markAllRead: useCallback(
      () => markAllRead.mutate(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [markAllRead.mutate]
    ),
    isMarkingAllRead: markAllRead.isPending,
  };
}
