'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';

/** Syncs the Zustand theme with localStorage + the OS preference on first mount. */
export function useTheme() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    const stored = localStorage.getItem('et-theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored ?? (prefersDark ? 'dark' : 'light'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { theme, setTheme, toggleTheme: useUIStore((s) => s.toggleTheme) };
}
