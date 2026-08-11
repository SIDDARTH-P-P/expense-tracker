'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { apiClient } from '@/services/api-client';

import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent! Redirecting to login page...');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <FiArrowLeft size={14} /> Back to log in
      </Link>

      <h1 className="font-display text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        {sent ? "Check your inbox for a reset link." : "Enter your email and we'll send you a reset link."}
      </p>

      {!sent ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<FiMail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            Send reset link
          </Button>
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          If an account exists for <span className="font-medium text-foreground">{email}</span>, you&apos;ll receive an
          email shortly with instructions to reset your password.
        </div>
      )}
    </div>
  );
}
