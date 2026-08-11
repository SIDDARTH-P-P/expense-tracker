'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEye, FiEyeOff, FiLock, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      toast.error('Invalid or missing reset token.');
      setErrorMsg('Invalid or missing password reset token. Please request a new link.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsSuccess(true);
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <FiCheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Password Changed!</h2>
        <p className="text-xs text-white/60 mb-6">
          Your password has been successfully reset. Redirecting you to login...
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground transition-all shadow-lg hover:opacity-90"
        >
          Proceed to Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full text-white">
      {/* Brand logo header */}
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-xl shadow-lg mb-3">
          V
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">Reset Password</h1>
        <p className="mt-1 text-xs text-white/60">Enter your new password to reset your account</p>
      </div>

      {errorMsg && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* New Password */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-[#171922] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-white/50 hover:text-white transition-colors"
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-white/40">Must include uppercase, lowercase, and number</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-[#171922] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-primary focus:outline-none transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-3.5 text-white/50 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        {/* Reset Password Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-3 w-full rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold py-3.5 text-sm transition-all shadow-lg shadow-primary/30 active:scale-98 disabled:opacity-50"
        >
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors">
          <FiArrowLeft size={14} /> Back to log in
        </Link>
      </div>

      <p className="mt-8 text-center text-[10px] text-white/40 leading-relaxed">
        Copyright © 2026 VaultCash Financial Suite. All Rights Reserved.
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-white/50 text-xs">Loading reset page...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
