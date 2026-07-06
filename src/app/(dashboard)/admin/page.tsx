'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/services/api-client';
import { useCurrentUser } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CardSkeleton } from '@/components/common/Skeleton';
import toast from 'react-hot-toast';
import { FiUsers, FiTrash2, FiShield, FiUser, FiTrendingUp, FiTrendingDown, FiRefreshCw } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  currency: string;
  createdAt: string;
  stats: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  };
}

function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => apiClient.get<AdminUser[]>('/admin/users'),
    retry: false,
  });
}

function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted successfully.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'user' | 'admin' }) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated.');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export default function AdminPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const currentUserFromStore = useAuthStore((s) => s.user);
  const { data: users, isLoading, isError, refetch } = useAdminUsers();
  const deleteUser = useDeleteUser();
  const changeRole = useChangeRole();

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // Redirect non-admins
  const role = currentUser?.role ?? currentUserFromStore?.role;
  if (role && role !== 'admin') {
    router.replace('/dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <FiShield size={24} className="text-primary" />
          <h1 className="font-display text-xl font-semibold">Admin Panel</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-4 py-20 text-center text-muted">
          <FiShield size={40} className="opacity-30" />
          <p className="font-medium">Access denied or failed to load admin data.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <FiRefreshCw size={14} /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalUsers = users?.length ?? 0;
  const totalTransactions = users?.reduce((s, u) => s + u.stats.transactionCount, 0) ?? 0;
  const totalBalance = users?.reduce((s, u) => s + u.stats.balance, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FiShield size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">Admin Panel</h1>
            <p className="text-sm text-muted">Manage all users and their data</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <FiRefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <FiUsers size={16} /> <span className="text-xs">Total Users</span>
          </div>
          <p className="font-display text-2xl font-bold">{totalUsers}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <FiTrendingUp size={16} /> <span className="text-xs">Total Transactions</span>
          </div>
          <p className="font-display text-2xl font-bold">{totalTransactions}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <FiTrendingDown size={16} /> <span className="text-xs">Net Balance (all users)</span>
          </div>
          <p className={`font-display text-2xl font-bold ${totalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(Math.abs(totalBalance), 'USD')}
          </p>
        </div>
      </div>

      {/* User list */}
      <div className="flex flex-col gap-3">
        {users?.map((u) => (
          <div
            key={u.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center"
          >
            {/* Avatar / name */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{u.name}</p>
                  {u.role === 'admin' && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Admin
                    </span>
                  )}
                  {u.id === currentUser?.id && (
                    <span className="rounded-full bg-income/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-income">
                      You
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted">{u.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <p className="text-muted">Transactions</p>
                <p className="font-semibold">{u.stats.transactionCount}</p>
              </div>
              <div>
                <p className="text-income">Income</p>
                <p className="font-semibold text-income">{formatCurrency(u.stats.totalIncome, u.currency)}</p>
              </div>
              <div>
                <p className="text-expense">Expense</p>
                <p className="font-semibold text-expense">{formatCurrency(u.stats.totalExpense, u.currency)}</p>
              </div>
            </div>

            {/* Actions */}
            {u.id !== currentUser?.id && (
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                  onClick={() => changeRole.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                  className={u.role === 'admin' ? 'border-expense/40 text-expense hover:bg-expense/10' : 'border-primary/40 text-primary hover:bg-primary/10'}
                >
                  {u.role === 'admin' ? <><FiUser size={13} /> Demote</> : <><FiShield size={13} /> Make Admin</>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  title="Delete user"
                  onClick={() => setDeleteTarget(u)}
                  className="border-expense/40 text-expense hover:bg-expense/10"
                >
                  <FiTrash2 size={13} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        description={`This will permanently delete ${deleteTarget?.email} and all their transactions and categories. This cannot be undone.`}
        confirmLabel="Delete User"
        isLoading={deleteUser.isPending}
        onConfirm={() => deleteUser.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
