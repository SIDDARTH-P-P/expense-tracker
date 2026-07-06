'use client';

import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import { useUIStore } from '@/store/ui.store';

/** Floating add button — visible only on desktop (lg+). Mobile uses BottomNav center button. */
export function FloatingAddButton() {
  const openAddSheet = useUIStore((s) => s.openAddSheet);

  return (
    <div className="hidden lg:block">
      {/* Pulse ring */}
      <span className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full gradient-primary opacity-25 animate-ping" />
        <motion.button
          onClick={() => openAddSheet('expense')}
          aria-label="Add transaction"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.07 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-white shadow-glow"
        >
          <FiPlus size={26} strokeWidth={2.5} />
        </motion.button>
      </span>
    </div>
  );
}
