'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient, ApiClientError } from '@/services/api-client';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import type { User } from '@/types';

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const setTheme = useUIStore((s) => s.setTheme);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await apiClient.get<User>('/auth/me');
      setUser(user);
      if (user.theme) {
        setTheme(user.theme);
      }
      return user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: { email: string; password: string; rememberMe?: boolean }) =>
      apiClient.post<User>('/auth/login', input),
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(['auth', 'me'], user);
      // Invalidate categories so the new user's categories load fresh (not a
      // previous user's cached data).
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      // router.refresh() forces Next.js to re-run server components & middleware
      // so the newly-set auth cookie is recognised before navigating.
      router.refresh();
      router.push('/dashboard');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useSignup() {
  const router = useRouter();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) =>
      apiClient.post<User>('/auth/signup', input),
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(['auth', 'me'], user);
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Account created. Welcome to your dashboard!');
      // router.refresh() so Next.js picks up the new auth cookie server-side.
      router.refresh();
      router.push('/dashboard');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useLogout() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      setUser(null);
      // Clear ALL cached queries so the next user starts with a clean slate.
      qc.clear();
      toast.success('Logged out successfully.');
      // router.refresh() tells Next.js server state changed (cookie deleted),
      // then push to /login so middleware sees no token.
      router.refresh();
      router.push('/login');
    },
    onError: () => {
      setUser(null);
      qc.clear();
      toast.success('Logged out successfully.');
      router.refresh();
      router.push('/login');
    },
  });
}
