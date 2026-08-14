'use client';

import { useSessionHeartbeat } from '@/hooks/useAuth';

/**
 * Mounted near the root layout.
 * Runs global session heartbeat loop across the entire app.
 */
export function SessionInitializer() {
  useSessionHeartbeat();
  return null;
}
