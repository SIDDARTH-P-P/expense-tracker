'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { FloatingAddButton } from './FloatingAddButton';
import { BottomSheet } from '@/components/common/BottomSheet';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { useUIStore } from '@/store/ui.store';
import { useCreateTransaction } from '@/hooks/useTransactions';

/**
 * AppShell — mobile-first layout.
 *
 * Mobile  : Header(sticky) + scrollable main + BottomNav(fixed)
 * Desktop : Sidebar(fixed) + Header(sticky) + scrollable main
 *
 * The outer div is h-screen/overflow-hidden so only <main> scrolls.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const isAddSheetOpen = useUIStore((s) => s.isAddSheetOpen);
  const closeAddSheet = useUIStore((s) => s.closeAddSheet);
  const defaultType = useUIStore((s) => s.addSheetDefaultType);
  const createTransaction = useCreateTransaction();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        {/* Only this scrolls */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-4 sm:px-6 sm:pb-10 lg:px-8"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* FAB — desktop only (mobile uses BottomNav center button) */}
      <FloatingAddButton />

      {/* Add / Edit transaction sheet */}
      <BottomSheet isOpen={isAddSheetOpen} onClose={closeAddSheet} title="Add transaction">
        <TransactionForm
          defaultType={defaultType}
          isSubmitting={createTransaction.isPending}
          onSubmit={(values) =>
            createTransaction.mutate(values, { onSuccess: closeAddSheet })
          }
        />
      </BottomSheet>
    </div>
  );
}
