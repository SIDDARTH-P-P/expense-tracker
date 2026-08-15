'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';

/** Mounted once near the root; hydrates the persisted/OS theme on load. */
export function ThemeInitializer() {
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    const stored = localStorage.getItem('et-theme') as 'light' | 'dark' | null;
    const targetTheme = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(targetTheme);
  }, [setTheme]);

  return null;
}
