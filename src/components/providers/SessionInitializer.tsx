'use client';

import { useSessionHeartbeat } from '@/hooks/useAuth';

/**
 * Mounted near the root layout. Runs the 15-second session heartbeat loop.
 * If the current session has been revoked from another device or deleted,
 * the server returns 401, triggering apiClient to show "Session expired"
 * toast and redirect to login immediately.
 */
export function SessionInitializer() {
  useSessionHeartbeat();
  return null;
}
