'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

export interface ActivityLogItem {
  id: string;
  action: string;
  category: string;
  title: string;
  description: string;
  details: Record<string, any>;
  device: {
    browser: string;
    os: string;
    deviceType: string;
    deviceName: string;
    ip: string;
    userAgent?: string;
  };
  timestamp: string;
}

export interface ActivityLogResponse {
  items: ActivityLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UseActivityLogParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}

export function useActivityLog(params: UseActivityLogParams = {}) {
  const { page = 1, pageSize = 20, category = 'ALL', search = '' } = params;

  const queryKey = ['activity-log', page, pageSize, category, search] as const;

  const { data, isLoading, isFetching, error, refetch } = useQuery<ActivityLogResponse>({
    queryKey,
    queryFn: async () => {
      const sp = new URLSearchParams();
      sp.set('page', String(page));
      sp.set('pageSize', String(pageSize));
      if (category && category !== 'ALL') sp.set('category', category);
      if (search && search.trim()) sp.set('search', search.trim());

      return apiClient.get<ActivityLogResponse>(`/activity-log?${sp.toString()}`);
    },
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });

  return {
    logs: data?.items ?? [],
    pagination: data?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useInfiniteActivityLog(params: Omit<UseActivityLogParams, 'page'> = {}) {
  const { pageSize = 20, category = 'ALL', search = '' } = params;

  return useInfiniteQuery({
    queryKey: ['activity-log', 'infinite', category, search, pageSize] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const sp = new URLSearchParams();
      sp.set('page', String(pageParam));
      sp.set('pageSize', String(pageSize));
      if (category && category !== 'ALL') sp.set('category', category);
      if (search && search.trim()) sp.set('search', search.trim());

      return apiClient.get<ActivityLogResponse>(`/activity-log?${sp.toString()}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}
