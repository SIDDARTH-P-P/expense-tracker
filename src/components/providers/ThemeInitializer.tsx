'use client';

import { useTheme } from '@/hooks/useTheme';

/** Mounted once near the root; hydrates the persisted/OS theme on load. */
export function ThemeInitializer() {
  useTheme();
  return null;
}
