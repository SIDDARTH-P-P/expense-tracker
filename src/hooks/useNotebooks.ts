'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient, ApiClientError } from '@/services/api-client';
import { useAuthStore } from '@/store/auth.store';
import type { Notebook } from '@/types';

export interface ActiveMonthStatus {
  exists: boolean;
  name: string;
  month: number;
  year: number;
  notebook?: Notebook | null;
}

export interface NotebooksResponse {
  notebooks: Notebook[];
  activeMonthStatus: ActiveMonthStatus;
}

export function notebooksQueryKey(userId?: string | null) {
  return ['notebooks', userId ?? 'guest'] as const;
}

export function useNotebooks(date?: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [...notebooksQueryKey(userId), date ?? ''],
    queryFn: () =>
      apiClient.get<NotebooksResponse>(
        `/notebooks${date ? `?date=${encodeURIComponent(date)}` : ''}`
      ),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useEnsureCurrentMonthNotebook() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date?: string) =>
      apiClient.post<Notebook>('/notebooks', { action: 'ensure_current', date }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: notebooksQueryKey(userId) });
      toast.success(`Book "${created.name}" ready.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useCreateNotebook() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiClient.post<Notebook>('/notebooks', { name }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: notebooksQueryKey(userId) });
      toast.success(`Book "${created.name}" created.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useTogglePinNotebook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: string | { notebookId: string; targetState?: boolean }) => {
      const notebookId = typeof args === 'string' ? args : args.notebookId;
      const targetState = typeof args === 'string' ? undefined : args.targetState;
      return apiClient.post<Notebook>('/notebooks', { action: 'toggle_pin', notebookId, targetState });
    },
    onSuccess: (updated) => {
      const isPinned = Boolean(updated.isPinned || updated.isStarred);
      qc.setQueriesData({ queryKey: ['notebooks'] }, (old: any) => {
        if (!old || !old.notebooks) return old;
        return {
          ...old,
          notebooks: old.notebooks.map((nb: any) =>
            nb.id === updated.id
              ? {
                  ...nb,
                  isPinned,
                  isStarred: isPinned,
                }
              : nb
          ),
        };
      });
      qc.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success(isPinned ? `Pinned "${updated.name}" to top` : `Unpinned "${updated.name}"`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useToggleStarNotebook() {
  return useTogglePinNotebook();
}
