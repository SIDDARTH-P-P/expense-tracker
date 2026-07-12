'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/format';

interface AnimatedNumberProps {
  value: number;
  currency?: string;
  className?: string;
}

/** Counts up/down smoothly whenever `value` changes — used across dashboard cards. */
export function AnimatedNumber({ value, currency = 'USD', className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20 });
  const [display, setDisplay] = useState(formatCurrency(0, currency));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    setDisplay(formatCurrency(spring.get(), currency));
    const unsub = spring.on('change', (v) => setDisplay(formatCurrency(v, currency)));
    return unsub;
  }, [spring, currency]);

  return (
    <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`amount ${className ?? ''}`}>
      {display}
    </motion.span>
  );
}
