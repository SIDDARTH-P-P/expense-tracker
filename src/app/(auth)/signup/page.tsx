'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiMail, FiLock, FiUser, FiZap } from 'react-icons/fi';
import { signupSchema, type SignupInput } from '@/lib/validations/auth.schema';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useSignup } from '@/hooks/useAuth';

export default function SignupPage() {
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  return (
    <div>
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-income text-primary-foreground">
          <FiZap size={20} />
        </div>
        <span className="font-display text-xl font-semibold">Ledgerly</span>
      </div>

      <h1 className="font-display text-2xl font-bold">Create your account</h1>
      <p className="mt-1 mb-8 text-sm text-muted">Start tracking your money in under a minute.</p>

      <form onSubmit={handleSubmit((values) => signup.mutate(values))} className="flex flex-col gap-4">
        <Input
          label="Full name"
          placeholder="Alex Johnson"
          leftIcon={<FiUser size={16} />}
          error={errors.name?.message}
          {...register('name')}
        />
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
          placeholder="At least 8 characters"
          leftIcon={<FiLock size={16} />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" className="mt-2 w-full" isLoading={signup.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
