'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { FloatingAddButton } from './FloatingAddButton';
import { BottomSheet } from '@/components/common/BottomSheet';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { CategoryModal } from '@/components/management/CategoryModal';
import { SplitModal } from '@/components/management/SplitModal';
import { SplitUserModal } from '@/components/management/SplitUserModal';
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
  const addSheetKind = useUIStore((s) => s.addSheetKind);
  const defaultType = useUIStore((s) => s.addSheetDefaultType);
  const createTransaction = useCreateTransaction();
  const isTransactionSheet = addSheetKind === 'transaction';
  const addSheetTitle =
    addSheetKind === 'category'
      ? 'Add category'
      : addSheetKind === 'splitUser'
        ? 'Add split user'
        : addSheetKind === 'split'
          ? 'Create split'
          : 'Add transaction';

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        {/* Only this scrolls */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28 sm:px-6 sm:pb-10 lg:px-8"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* FAB — desktop only (mobile uses BottomNav center button) */}
      <FloatingAddButton />

      {/* Add / Edit transaction sheet */}
      <BottomSheet
        isOpen={isAddSheetOpen}
        onClose={closeAddSheet}
        title={addSheetTitle}
        showHeader={!isTransactionSheet && addSheetKind !== 'category'}
        className={
          isTransactionSheet || addSheetKind === 'category'
            ? 'h-[100dvh] max-h-[100dvh] rounded-none border-0 bg-surface p-0 sm:h-[92vh] sm:max-w-[430px] sm:rounded-2xl sm:border sm:p-0'
            : undefined
        }
      >
        {addSheetKind === 'transaction' && (
          <TransactionForm
            defaultType={defaultType}
            isSubmitting={createTransaction.isPending}
            onCancel={closeAddSheet}
            onSubmit={(values, intent) =>
              createTransaction.mutate(values, { onSuccess: intent === 'saveAndNew' ? undefined : closeAddSheet })
            }
          />
        )}
        {addSheetKind === 'category' && <CategoryModal onClose={closeAddSheet} />}
        {addSheetKind === 'splitUser' && <SplitUserModal onClose={closeAddSheet} />}
        {addSheetKind === 'split' && <SplitModal onClose={closeAddSheet} />}
      </BottomSheet>
    </div>
  );
}
