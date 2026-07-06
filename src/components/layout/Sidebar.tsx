'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiShield, FiLogOut } from 'react-icons/fi';
import { NAV_ITEMS } from '@/constants/nav';
import { cn } from '@/lib/utils/cn';
import { useLogout, useCurrentUser } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/common/Avatar';

/** Premium fixed sidebar — visible on lg+ screens only */
export function Sidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const authUser = useAuthStore((s) => s.user);
  const { data: user } = useCurrentUser();
  const displayUser = user ?? authUser;

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-border/50 bg-surface/60 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/40">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl gradient-primary text-white shadow-glow">
          <FiZap size={18} />
        </div>
        <span className="font-display text-lg font-bold gradient-text">Ledgerly</span>
      </div>

      {/* User card */}
      <div className="mx-4 my-4 rounded-2xl bg-surface-2/80 p-3.5 flex items-center gap-3">
        <Avatar name={displayUser?.name ?? 'U'} size={38} className="shrink-0 ring-2 ring-primary/20" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{displayUser?.name ?? '—'}</p>
          <p className="text-xs text-muted truncate">{displayUser?.email ?? ''}</p>
        </div>
        {displayUser?.role === 'admin' && (
          <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
            Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-surface-2 hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-2xl bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Icon size={18} className="relative" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}

        {/* Admin link */}
        {displayUser?.role === 'admin' && (
          <Link
            href="/admin"
            className={cn(
              'relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200 mt-1',
              pathname.startsWith('/admin')
                ? 'bg-primary/10 text-primary'
                : 'text-muted hover:bg-surface-2 hover:text-foreground'
            )}
          >
            <FiShield size={18} />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-2 border-t border-border/40 mt-2">
        <button
          onClick={() => logout.mutate()}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-muted transition-all hover:bg-expense/10 hover:text-expense"
        >
          <FiLogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
