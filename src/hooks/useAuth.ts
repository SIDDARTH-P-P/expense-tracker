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
        const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('et-theme') : null;
        if (!storedTheme) {
          setTheme(user.theme);
        }
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
      qc.clear();
      setUser(user);
      qc.setQueryData(['auth', 'me'], user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
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
      qc.clear();
      setUser(user);
      qc.setQueryData(['auth', 'me'], user);
      toast.success('Account created. Welcome to your dashboard!');
      router.refresh();
      router.push('/dashboard');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: Partial<User>) => apiClient.patch<User>('/auth/me', input),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      qc.setQueryData(['auth', 'me'], updatedUser);
      toast.success('Profile updated successfully.');
    },
    onError: (err: ApiClientError) => {
      toast.error(err.message || 'Failed to update profile.');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).__IS_LOGGING_OUT = true;
      }
      return apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      qc.clear();
      toast.success('Logged out successfully.');
      window.location.replace('/login');
    },
    onError: () => {
      setUser(null);
      qc.clear();
      toast.success('Logged out successfully.');
      window.location.replace('/login');
    },
  });
}
