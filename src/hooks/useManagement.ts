'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient, ApiClientError } from '@/services/api-client';
import { useAuthStore } from '@/store/auth.store';
import type { Split, SplitUser } from '@/types';
import type { SplitUserFormValues } from '@/lib/validations/split-user.schema';
import type { SplitFormValues } from '@/lib/validations/split.schema';

export function splitUsersQueryKey(userId?: string | null) {
  return ['split-users', userId ?? 'guest'] as const;
}

export function splitsQueryKey(userId?: string | null) {
  return ['splits', userId ?? 'guest'] as const;
}

function searchSuffix(search?: string) {
  return search ? `?search=${encodeURIComponent(search)}` : '';
}

export function useSplitUsers(search?: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [...splitUsersQueryKey(userId), search ?? ''],
    queryFn: () => apiClient.get<SplitUser[]>(`/split-users${searchSuffix(search)}`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSplitUser() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SplitUserFormValues) => apiClient.post<SplitUser>('/split-users', input),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: splitUsersQueryKey(userId) });
      toast.success(`Split user ${created.recordId} created.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateSplitUser() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SplitUserFormValues> }) =>
      apiClient.patch<SplitUser>(`/split-users/${id}`, input),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: splitUsersQueryKey(userId) });
      qc.invalidateQueries({ queryKey: splitsQueryKey(userId) });
      toast.success(`Split user ${updated.recordId} updated.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDeleteSplitUser() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/split-users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: splitUsersQueryKey(userId) });
      qc.invalidateQueries({ queryKey: splitsQueryKey(userId) });
      toast.success('Split user deleted.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useSplits(search?: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [...splitsQueryKey(userId), search ?? ''],
    queryFn: () => apiClient.get<Split[]>(`/splits${searchSuffix(search)}`),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useCreateSplit() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SplitFormValues) => apiClient.post<Split>('/splits', input),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: splitsQueryKey(userId) });
      toast.success(`Split ${created.recordId} created.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateSplit() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SplitFormValues> }) =>
      apiClient.patch<Split>(`/splits/${id}`, input),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: splitsQueryKey(userId) });
      toast.success(`Split ${updated.recordId} updated.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDeleteSplit() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/splits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: splitsQueryKey(userId) });
      toast.success('Split deleted.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
