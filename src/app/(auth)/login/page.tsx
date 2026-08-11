'use client';

import Link from 'next/link';
import { useState, Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import { loginSchema, type LoginInput } from '@/lib/validations/auth.schema';
import { useLogin } from '@/hooks/useAuth';
import { GoogleAuthModal } from '@/components/auth/GoogleAuthModal';
import toast from 'react-hot-toast';

function SessionExpiredAlert() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (reason === 'session_expired') {
      toast.error('Session expired. Please log in again.');
    }
  }, [reason]);

  return null;
}

export default function LoginPage() {
  const login = useLogin();
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <div className="w-full text-white">
      <Suspense fallback={null}>
        <SessionExpiredAlert />
      </Suspense>

      {/* Main Title matching phone screens */}
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-white mb-2">
        Welcome back
      </h1>
      <p className="text-xs text-white/60 mb-6 font-medium">Log in to keep track of your financial ledger.</p>

      {/* Social login buttons section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-[#1D202B] hover:bg-[#252836] border border-white/10 px-4 py-3 text-xs font-semibold text-white transition-all shadow-md active:scale-98"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-[#1D202B] hover:bg-[#252836] border border-white/10 px-4 py-3 text-xs font-semibold text-white transition-all shadow-md active:scale-98"
          >
            <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <span className="relative bg-[#0D0F15] px-3 text-[11px] uppercase tracking-wider text-white/40 font-semibold">
          or sign in with email
        </span>
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit((values) => login.mutate({ ...values, rememberMe }))}
        className="flex flex-col gap-4"
      >
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Email</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            className={`w-full rounded-xl bg-[#171922] border px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none transition-all ${
              errors.email ? 'border-rose-500/80' : 'border-white/10'
            }`}
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`w-full rounded-xl bg-[#171922] border px-4 py-3 pr-10 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none transition-all ${
                errors.password ? 'border-rose-500/80' : 'border-white/10'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-white/50 hover:text-white transition-colors"
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-[11px] text-rose-400 font-medium">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#171922] accent-primary cursor-pointer"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-semibold text-primary hover:opacity-80 transition-opacity">
            Forgot password?
          </Link>
        </div>

        {/* Primary Login Button */}
        <button
          type="submit"
          disabled={login.isPending}
          className="mt-3 w-full rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold py-3.5 text-sm transition-all shadow-lg shadow-primary/30 active:scale-98"
        >
          {login.isPending ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {/* Signup prompt */}
      <p className="mt-6 text-center text-xs text-white/60">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-primary hover:opacity-80 transition-opacity">
          Sign up
        </Link>
      </p>

      {/* Google Auth Modal */}
      <GoogleAuthModal isOpen={isGoogleModalOpen} onClose={() => setIsGoogleModalOpen(false)} />
    </div>
  );
}

