import { create } from 'zustand';

export type ManagementTab = 'category' | 'splitUsers' | 'splits';
export type AddSheetKind = 'transaction' | 'category' | 'splitUser' | 'split';

interface UIState {
  theme: 'light' | 'dark';
  isAddSheetOpen: boolean;
  addSheetKind: AddSheetKind;
  addSheetDefaultType: 'income' | 'expense';
  managementActiveTab: ManagementTab;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  openAddSheet: (type?: 'income' | 'expense') => void;
  openManagementAddSheet: () => void;
  closeAddSheet: () => void;
  setManagementActiveTab: (tab: ManagementTab) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  isAddSheetOpen: false,
  addSheetKind: 'transaction',
  addSheetDefaultType: 'expense',
  managementActiveTab: 'category',
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('et-theme', theme);
    }
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
  openAddSheet: (type = 'expense') => set({ isAddSheetOpen: true, addSheetKind: 'transaction', addSheetDefaultType: type }),
  openManagementAddSheet: () => {
    const activeTab = get().managementActiveTab;
    const addSheetKind: AddSheetKind =
      activeTab === 'category' ? 'category' : activeTab === 'splitUsers' ? 'splitUser' : 'split';
    set({ isAddSheetOpen: true, addSheetKind });
  },
  closeAddSheet: () => set({ isAddSheetOpen: false }),
  setManagementActiveTab: (tab) => set({ managementActiveTab: tab }),
}));
