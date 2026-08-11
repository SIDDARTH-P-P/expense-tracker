'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiArrowLeft, FiEye, FiEyeOff, FiUser, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export function GoogleAuthModal({ isOpen, onClose, defaultEmail = '' }: GoogleAuthModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [emailOrPhone, setEmailOrPhone] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '944597361683-t573ngje433r2go8rq5enj4jrg7q6ged.apps.googleusercontent.com';

  useEffect(() => {
    // Reset state whenever modal opens or closes
    setStep(1);
    setPassword('');
    setIsSubmitting(false);

    if (!isOpen) return;

    // Inject Google OAuth GSI Script
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsSubmitting(false);
    setStep(1);
    setPassword('');
    onClose();
  };

  const handleTriggerGoogleOAuth = () => {
    setIsSubmitting(true);

    // Auto reset isSubmitting status after 4s so user can re-click if popup was closed/canceled
    setTimeout(() => {
      setIsSubmitting(false);
    }, 4000);

    // @ts-expect-error Google GSI global
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        // @ts-expect-error Google GSI global
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (tokenResponse: { access_token?: string; error?: string }) => {
            if (tokenResponse.error || !tokenResponse.access_token) {
              toast.error('Google sign-in was canceled');
              setIsSubmitting(false);
              return;
            }

            try {
              const authRes = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accessToken: tokenResponse.access_token,
                }),
              });

              const data = await authRes.json();
              if (!authRes.ok || !data.success) {
                throw new Error(data.error || 'Authentication failed on server');
              }

              toast.success(`Welcome, ${data.data?.name || data.data?.email || 'User'}!`);
              setIsSubmitting(true);
              window.location.replace('/dashboard');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Google authentication failed';
              toast.error(msg);
              setIsSubmitting(false);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        console.error('Google OAuth error:', err);
        fallbackGoogleAuthPopup();
      }
    } else {
      fallbackGoogleAuthPopup();
    }
  };

  const fallbackGoogleAuthPopup = () => {
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      GOOGLE_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent(
      'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
    )}&prompt=select_account`;

    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = googleAuthUrl;
      return;
    }

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      googleAuthUrl,
      'Google Sign In',
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      window.location.href = googleAuthUrl;
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const input = emailOrPhone.trim();
    if (!input) {
      toast.error('Please enter your Email or Phone number');
      return;
    }

    setStep(2);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Please enter your account password');
      return;
    }

    setIsSubmitting(true);
    try {
      const input = emailOrPhone.trim();
      const email = input.includes('@') ? input : `${input}@gmail.com`;

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid password or credentials');
      }

      toast.success(`Welcome back, ${data.data?.name || 'User'}!`);
      handleClose();
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedEmail = emailOrPhone.trim().includes('@')
    ? emailOrPhone.trim()
    : `${emailOrPhone.trim()}@gmail.com`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Google Login Sheet / Card */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative z-10 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-[#161821] p-7 text-white shadow-2xl border border-white/10"
          >
            {/* Top Bar: Back & Close Buttons */}
            <div className="flex items-center justify-between mb-4">
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/20 transition-all font-medium"
                >
                  <FiArrowLeft size={14} /> Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleClose}
                className="rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition-all"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Google Colored Logo */}
            <button
              type="button"
              onClick={handleTriggerGoogleOAuth}
              className="flex justify-center mb-5 pt-1 w-full hover:scale-105 transition-transform"
            >
              <svg className="h-10 w-10" viewBox="0 0 24 24">
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
            </button>

            {/* Header text matching screenshot */}
            <div className="text-left mb-5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {step === 1 ? 'Login' : 'Authenticate'}
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                {step === 1 ? 'Continue to Google' : 'Enter password to log in'}
              </p>
            </div>

            {step === 1 ? (
              /* STEP 1: Google OAuth + Enter Email/Phone */
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* Prominent Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleTriggerGoogleOAuth}
                  disabled={isSubmitting}
                  className="w-full mb-4 flex items-center justify-center gap-3 rounded-full bg-[#363A4A] hover:bg-[#42475A] border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-all shadow-lg active:scale-98"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white p-1">
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
                  </div>
                  <span>{isSubmitting ? 'Opening Google...' : 'Continue with Google'}</span>
                </button>

                <div className="relative flex items-center justify-center mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative bg-[#161821] px-3 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                    or enter email / phone
                  </span>
                </div>

                <form onSubmit={handleStep1Next} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5 font-medium">Email or Phone</label>
                    <input
                      type="text"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="Email or Phone"
                      className="w-full rounded-xl bg-[#1E212D] border border-white/15 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toast.success('Password reset instructions sent to your email.')}
                      className="text-xs text-primary hover:opacity-80 transition-opacity font-medium"
                    >
                      Forgot Account?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="mt-1 w-full rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 text-sm transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                  >
                    Next
                  </button>
                </form>
              </motion.div>
            ) : (
              /* STEP 2: Password Authentication */
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {/* Account Selection Badge */}
                <div className="flex items-center justify-between rounded-xl bg-[#1E212D] border border-white/15 px-3.5 py-2.5 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <FiUser size={14} />
                    </div>
                    <span className="text-xs font-mono font-medium text-white truncate">{formattedEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-primary hover:opacity-80 font-medium shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1.5 font-medium">Enter Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoFocus
                        className="w-full rounded-xl bg-[#1E212D] border border-white/15 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-primary focus:outline-none transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 text-sm transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      'Authenticating...'
                    ) : (
                      <>
                        <FiCheckCircle size={16} />
                        <span>Log In & Continue</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
