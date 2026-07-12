'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { DashboardSummary } from '@/types';

export function useDashboardSummary(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const queryStr = params.toString();

  return useQuery({
    queryKey: ['dashboard', 'summary', from, to],
    queryFn: () => apiClient.get<DashboardSummary>(`/dashboard/summary${queryStr ? `?${queryStr}` : ''}`),
    staleTime: 60 * 1000,
  });
}
