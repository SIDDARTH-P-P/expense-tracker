'use client';

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient, ApiClientError } from '@/services/api-client';
import type { DashboardSummary, PaginatedResult, Transaction } from '@/types';
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

function parseTransactionDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isSameDay(a: Date, b: Date) {
  return isSameMonth(a, b) && a.getDate() === b.getDate();
}

function addTransactionToSummary(summary: DashboardSummary, transaction: Transaction): DashboardSummary {
  const amount = Number(transaction.amount) || 0;
  const signedAmount = transaction.type === 'income' ? amount : -amount;
  const transactionDate = parseTransactionDate(transaction.date);
  const now = new Date();
  const inCurrentMonth = transactionDate ? isSameMonth(transactionDate, now) : false;
  const isToday = transactionDate ? isSameDay(transactionDate, now) : false;

  const monthlyIncome = summary.monthlyIncome + (inCurrentMonth && transaction.type === 'income' ? amount : 0);
  const monthlyExpense = summary.monthlyExpense + (inCurrentMonth && transaction.type === 'expense' ? amount : 0);
  const recentTransactions = [transaction, ...summary.recentTransactions.filter((item) => item.id !== transaction.id)]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const monthlyTrend = transactionDate
    ? summary.monthlyTrend.map((item) =>
        item.month === transactionDate.toLocaleString('en-US', { month: 'short' })
          ? { ...item, [transaction.type]: item[transaction.type] + amount }
          : item
      )
    : summary.monthlyTrend;

  return {
    ...summary,
    totalBalance: summary.totalBalance + signedAmount,
    monthlyIncome,
    monthlyExpense,
    monthlySavings: monthlyIncome - monthlyExpense,
    todaySpending: summary.todaySpending + (isToday && transaction.type === 'expense' ? amount : 0),
    recentTransactions,
    monthlyTrend,
  };
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
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      toast.success(`Transaction ${created.recordId} added.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionFormValues> }) =>
      apiClient.patch<Transaction>(`/transactions/${id}`, input),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      toast.success(`Transaction ${updated.recordId} updated.`);
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
    onSuccess: (duplicated) => {
      qc.setQueryData<DashboardSummary>(['dashboard', 'summary'], (summary) =>
        summary ? addTransactionToSummary(summary, duplicated) : summary
      );
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      toast.success(`Transaction ${duplicated.recordId} duplicated.`);
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}
