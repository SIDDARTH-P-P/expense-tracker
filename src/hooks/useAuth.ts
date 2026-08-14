'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient, ApiClientError } from '@/services/api-client';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import type { User } from '@/types';

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const setTheme = useUIStore((s) => s.setTheme);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await apiClient.get<User>('/auth/me');
      setUser(user);
      if (user.theme) {
        const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('et-theme') : null;
        if (!storedTheme) {
          setTheme(user.theme);
        }
      }
      return user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: { email: string; password: string; rememberMe?: boolean }) =>
      apiClient.post<User>('/auth/login', input),
    onSuccess: (user) => {
      qc.clear();
      setUser(user);
      qc.setQueryData(['auth', 'me'], user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      router.refresh();
      router.push('/dashboard');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useSignup() {
  const router = useRouter();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) =>
      apiClient.post<User>('/auth/signup', input),
    onSuccess: (user) => {
      qc.clear();
      setUser(user);
      qc.setQueryData(['auth', 'me'], user);
      toast.success('Account created. Welcome to your dashboard!');
      router.refresh();
      router.push('/dashboard');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: Partial<User>) => apiClient.patch<User>('/auth/me', input),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      qc.setQueryData(['auth', 'me'], updatedUser);
      toast.success('Profile updated successfully.');
    },
    onError: (err: ApiClientError) => {
      toast.error(err.message || 'Failed to update profile.');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).__IS_LOGGING_OUT = true;
      }
      return apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      qc.clear();
      toast.success('Logged out successfully.');
      window.location.replace('/login');
    },
    onError: () => {
      setUser(null);
      qc.clear();
      toast.success('Logged out successfully.');
      window.location.replace('/login');
    },
  });
}

// ─── Session Management ───────────────────────────────────────────────────────

export interface SessionInfo {
  id: string;
  sessionId: string;
  deviceName: string;
  os: string;
  browser: string;
  ip: string;
  location: string;
  loginAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

export function useSessions() {
  return useQuery<SessionInfo[]>({
    queryKey: ['auth', 'sessions'],
    queryFn: () => apiClient.get<SessionInfo[]>('/auth/sessions'),
    staleTime: 30 * 1000,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/auth/sessions/${sessionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      toast.success('Session revoked.');
    },
    onError: (err: ApiClientError) => toast.error(err.message || 'Failed to revoke session.'),
  });
}

export function useRevokeAllSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete('/auth/sessions'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      toast.success('All other sessions signed out.');
    },
    onError: (err: ApiClientError) => toast.error(err.message || 'Failed to revoke sessions.'),
  });
}

// ─── Session Heartbeat ────────────────────────────────────────────────────────
/**
 * Perform a single check on mount.
 * Continuous polling is disabled — session revocation events are handled
 * in real-time via Server-Sent Events (SSE) stream in useNotifications.
 */
export function useSessionHeartbeat() {
  useEffect(() => {
    const check = async () => {
      try {
        await apiClient.get('/auth/sessions/check');
      } catch {
        // api-client handles 401 → shows toast + redirects automatically
      }
    };

    // Run single initial check on mount
    check();
  }, []);
}

// ─── Login Alert SSE Listener ─────────────────────────────────────────────────
/**
 * Listens on the existing SSE stream for `login_alert` events.
 * When a new device logs into the same account, shows an alert toast.
 */
export function useLoginAlertListener() {
  const shownAlerts = useRef<Set<string>>(new Set());

  useEffect(() => {
    const es = new EventSource('/api/notifications/sse', { withCredentials: true });

    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as {
          deviceName: string;
          os: string;
          browser: string;
          ip: string;
          location: string;
          loginAt: string;
        };

        // Dedupe by loginAt timestamp
        const key = data.loginAt;
        if (shownAlerts.current.has(key)) return;
        shownAlerts.current.add(key);

        const locationStr =
          data.location && data.location !== 'Unknown location' && data.location !== 'Local network'
            ? ` from ${data.location}`
            : '';
        const ipStr = data.ip && data.ip !== '::1' ? ` (${data.ip})` : '';

        toast(
          `🔔 New login on ${data.browser}${locationStr}${ipStr}`,
          {
            duration: 8000,
            id: `login-alert-${key}`,
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-foreground)',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
            },
            icon: '⚠️',
          }
        );
      } catch {
        // ignore malformed events
      }
    };

    es.addEventListener('login_alert', handler);

    return () => {
      es.removeEventListener('login_alert', handler);
      es.close();
    };
  }, []);
}
