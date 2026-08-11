'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/services/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';

/** Syncs the Zustand theme with localStorage + the OS preference on first mount. */
export function useTheme() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem('et-theme') as 'light' | 'dark' | null;
    const targetTheme = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (useUIStore.getState().theme !== targetTheme) {
      setTheme(targetTheme);
    }
  }, [setTheme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Immediately apply theme state & DOM changes
    setTheme(nextTheme);

    // Update React Query cache in-place without triggering a refetch flicker
    qc.setQueryData<User | undefined>(['auth', 'me'], (old) => {
      if (!old) return old;
      return { ...old, theme: nextTheme };
    });

    if (user) {
      try {
        await apiClient.patch('/settings', { theme: nextTheme });
      } catch (e) {
        // Ignore background sync errors
      }
    }
  };

  return { theme, setTheme, toggleTheme };
}
