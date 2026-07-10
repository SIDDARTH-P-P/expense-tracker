'use client';

import { motion } from 'framer-motion';
import { useUIStore, type ManagementTab } from '@/store/ui.store';
import { cn } from '@/lib/utils/cn';

const TABS: Array<{ value: ManagementTab; label: string }> = [
  { value: 'category', label: 'Category' },
  { value: 'splitUsers', label: 'Split Users' },
  { value: 'splits', label: 'Splits' },
];

export function ManagementTabs() {
  const activeTab = useUIStore((s) => s.managementActiveTab);
  const setActiveTab = useUIStore((s) => s.setManagementActiveTab);

  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-surface p-1 shadow-soft">
      {TABS.map((tab) => {
        const selected = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'relative h-8 min-w-0 rounded-xl px-2 text-xs font-bold transition sm:text-sm',
              selected ? 'text-primary-foreground' : 'text-muted hover:text-foreground'
            )}
          >
            {selected && (
              <motion.span
                layoutId="management-tab-indicator"
                className="absolute inset-0 rounded-xl bg-primary shadow-glow"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
