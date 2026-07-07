'use client';

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient, ApiClientError } from '@/services/api-client';
import type { PaginatedResult, Transaction } from '@/types';
import type { TransactionFormValues } from '@/lib/validations/transaction.schema';
import type { UseQueryOptions } from '@tanstack/react-query';

export interface TransactionFilters {
  search?: string;
  type?: 'income' | 'expense';
  category?: string;
  from?: string;
  to?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

function buildQuery(filters: TransactionFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export function useTransactions(
  filters: TransactionFilters = {},
  options: Pick<UseQueryOptions<PaginatedResult<Transaction>, ApiClientError>, 'enabled'> = {}
) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => apiClient.get<PaginatedResult<Transaction>>(`/transactions?${buildQuery(filters)}`),
    placeholderData: (prev) => prev,
    ...options,
  });
}

/** Infinite-scroll version — accumulates pages, used by TransactionList. */
export function useInfiniteTransactions(filters: Omit<TransactionFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PaginatedResult<Transaction>>(
        `/transactions?${buildQuery({ ...filters, page: pageParam as number, pageSize: 15 })}`
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionFormValues) => apiClient.post<Transaction>('/transactions', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      toast.success('Transaction added.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionFormValues> }) =>
      apiClient.patch<Transaction>(`/transactions/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      toast.success('Transaction updated.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      toast.success('Transaction deleted.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useDuplicateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<Transaction>(`/transactions/duplicate/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      toast.success('Transaction duplicated.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
