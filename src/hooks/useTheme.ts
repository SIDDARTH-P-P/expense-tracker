'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/services/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';

export function useTheme() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  // Ensure DOM html class always stays in sync with active theme state
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('et-theme', theme);
    }
  }, [theme]);

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
