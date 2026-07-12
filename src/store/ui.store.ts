import { create } from 'zustand';

export type ManagementTab = 'category' | 'splitUsers' | 'splits';
export type AddSheetKind = 'transaction' | 'category' | 'splitUser' | 'split';
export type DateFilterType = 'all' | 'month' | 'year';

interface UIState {
  theme: 'light' | 'dark';
  isAddSheetOpen: boolean;
  addSheetKind: AddSheetKind;
  addSheetDefaultType: 'income' | 'expense';
  managementActiveTab: ManagementTab;
  dateFilterType: DateFilterType;
  selectedMonth: number; // 0-11
  selectedYear: number;
  splitFilterMode: 'all' | 'own';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  openAddSheet: (type?: 'income' | 'expense') => void;
  openManagementAddSheet: () => void;
  closeAddSheet: () => void;
  setManagementActiveTab: (tab: ManagementTab) => void;
  setDateFilterType: (type: DateFilterType) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  setSplitFilterMode: (mode: 'all' | 'own') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  isAddSheetOpen: false,
  addSheetKind: 'transaction',
  addSheetDefaultType: 'expense',
  managementActiveTab: 'category',
  dateFilterType: 'all',
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
  splitFilterMode: 'all',
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
  setDateFilterType: (type) => set({ dateFilterType: type }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSplitFilterMode: (mode) => set({ splitFilterMode: mode }),
}));
