'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient, ApiClientError } from '@/services/api-client';
import { useAuthStore } from '@/store/auth.store';
import type { Category } from '@/types';
import type { CategoryFormValues } from '@/lib/validations/category.schema';

/**
 * Returns the scoped query key for categories.
 * Including the userId ensures that when a different user logs in,
 * their categories are fetched fresh rather than reading from the
 * previous user's cache entry.
 */
export function categoriesQueryKey(userId?: string | null) {
  return ['categories', userId ?? 'guest'] as const;
}

export function useCategories(search?: string) {
  // Read the logged-in user's id from the Zustand auth store.
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [...categoriesQueryKey(userId), search ?? ''],
    queryFn: () => apiClient.get<Category[]>(`/categories${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    // Don't fetch if there's no authenticated user yet.
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryFormValues) => apiClient.post<Category>('/categories', input),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: categoriesQueryKey(userId) });
      toast.success(`Category ${created.recordId} created.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateCategory() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryFormValues> }) =>
      apiClient.patch<Category>(`/categories/${id}`, input),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: categoriesQueryKey(userId) });
      toast.success(`Category ${updated.recordId} updated.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDeleteCategory() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesQueryKey(userId) });
      toast.success('Category deleted.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
