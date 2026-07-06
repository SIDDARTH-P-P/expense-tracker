'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import { NAV_ITEMS } from '@/constants/nav';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/store/ui.store';

/**
 * Fixed bottom tab bar for mobile (hidden on lg+).
 * Center slot is a prominent "+" add button.
 */
export function BottomNav() {
  const pathname = usePathname();
  const openAddSheet = useUIStore((s) => s.openAddSheet);

  const navItems = NAV_ITEMS.filter((item) => item.href !== '/profile');

  // Split NAV_ITEMS into left half and right half for the center + button
  const mid = Math.floor(navItems.length / 2);
  const leftItems = navItems.slice(0, mid);
  const rightItems = navItems.slice(mid);

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-border/60 bg-surface/90 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {/* Left nav items */}
      {leftItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <NavTab key={href} href={href} label={label} icon={Icon} isActive={isActive} />
        );
      })}

      {/* Center add button */}
      <div className="relative flex flex-col items-center pb-1 pt-2">
        <motion.button
          onClick={() => openAddSheet('expense')}
          aria-label="Add transaction"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-white shadow-glow -mt-6"
        >
          <FiPlus size={26} strokeWidth={2.5} />
        </motion.button>
        <span className="mt-1 text-[10px] font-medium text-muted">Add</span>
      </div>

      {/* Right nav items */}
      {rightItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <NavTab key={href} href={href} label={label} icon={Icon} isActive={isActive} />
        );
      })}
    </nav>
  );
}

function NavTab({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-1 flex-col items-center gap-0.5 py-2 pt-3"
    >
      <div className="relative flex items-center justify-center">
        {isActive && (
          <motion.span
            layoutId="bottom-nav-dot"
            className="absolute -top-1.5 h-1.5 w-5 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <Icon
          size={22}
          className={cn(
            'transition-colors duration-200',
            isActive ? 'text-primary' : 'text-muted'
          )}
        />
      </div>
      <span
        className={cn(
          'text-[10px] font-medium transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted'
        )}
      >
        {label}
      </span>
    </Link>
  );
}
