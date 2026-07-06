'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiMail, FiLock, FiZap } from 'react-icons/fi';
import { loginSchema, type LoginInput } from '@/lib/validations/auth.schema';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const login = useLogin();
  const [rememberMe, setRememberMe] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <div>
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-income text-primary-foreground">
          <FiZap size={20} />
        </div>
        <span className="font-display text-xl font-semibold">Ledgerly</span>
      </div>

      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 mb-8 text-sm text-muted">Log in to keep track of your money.</p>

      <form
        onSubmit={handleSubmit((values) => login.mutate({ ...values, rememberMe }))}
        className="flex flex-col gap-4"
      >
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<FiMail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<FiLock size={16} />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full" isLoading={login.isPending}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
