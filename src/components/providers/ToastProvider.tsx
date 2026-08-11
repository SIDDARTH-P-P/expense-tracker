'use client';

import { Toaster, toast, resolveValue, Toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiLoader } from 'react-icons/fi';
import { cn } from '@/lib/utils/cn';

function ToastCustomItem({ t }: { t: Toast }) {
  const message = resolveValue(t.message, t);
  const type = t.type;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isLoading = type === 'loading';

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.98 }}
      animate={t.visible ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.08, ease: 'easeOut' }}
      className={cn(
        'relative flex items-center gap-3 min-w-[280px] max-w-[400px] p-3.5 rounded-2xl backdrop-blur-2xl shadow-2xl border pointer-events-auto will-change-transform transform-gpu',
        isSuccess && 'bg-slate-950/95 text-white border-emerald-500/40 shadow-emerald-950/50 ring-1 ring-emerald-500/30',
        isError && 'bg-slate-950/95 text-white border-rose-500/40 shadow-rose-950/50 ring-1 ring-rose-500/30',
        isLoading && 'bg-slate-950/95 text-white border-sky-500/40 shadow-sky-950/50 ring-1 ring-sky-500/30',
        !isSuccess && !isError && !isLoading && 'bg-slate-950/95 text-white border-white/20 shadow-black/60'
      )}
    >
      {/* Neon left accent line */}
      <span
        className={cn(
          'absolute left-0 top-3 bottom-3 w-1 rounded-r-full',
          isSuccess && 'bg-emerald-400 shadow-[0_0_10px_#10b981]',
          isError && 'bg-rose-500 shadow-[0_0_10px_#f43f5e]',
          isLoading && 'bg-sky-400 shadow-[0_0_10px_#38bdf8]',
          !isSuccess && !isError && !isLoading && 'bg-primary'
        )}
      />

      {/* Icon Badge */}
      <div className="pl-1 shrink-0">
        {isSuccess && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <FiCheckCircle size={18} />
          </div>
        )}
        {isError && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <FiAlertCircle size={18} />
          </div>
        )}
        {isLoading && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
            <FiLoader size={18} className="animate-spin" />
          </div>
        )}
        {!isSuccess && !isError && !isLoading && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white shadow-inner">
            <FiInfo size={18} />
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="min-w-0 flex-1 pr-1">
        <div className="text-sm font-semibold text-white leading-tight break-words tracking-tight">
          {message}
        </div>
      </div>

      {/* Close button */}
      {!isLoading && (
        <button
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 rounded-lg p-1 text-muted hover:bg-white/15 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <FiX size={15} />
        </button>
      )}
    </motion.div>
  );
}

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        top: 16,
        right: 16,
      }}
      toastOptions={{
        duration: 3000,
      }}
    >
      {(t) => <ToastCustomItem t={t} />}
    </Toaster>
  );
}
