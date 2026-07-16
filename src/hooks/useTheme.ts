'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/services/api-client';
import { useQueryClient } from '@tanstack/react-query';

/** Syncs the Zustand theme with localStorage + the OS preference on first mount. */
export function useTheme() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem('et-theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored ?? (prefersDark ? 'dark' : 'light'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (user) {
      try {
        await apiClient.patch('/settings', { theme: nextTheme });
        qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      } catch (e) {
        // Ignore background sync errors
      }
    }
  };

  return { theme, setTheme, toggleTheme };
}
