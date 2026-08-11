import { create } from 'zustand';

export type ManagementTab = 'category' | 'splitUsers' | 'splits';
export type AddSheetKind = 'transaction' | 'category' | 'splitUser' | 'split';
export type DateFilterType = 'all' | 'month' | 'year' | 'custom';

interface UIState {
  theme: 'light' | 'dark';
  isAddSheetOpen: boolean;
  addSheetKind: AddSheetKind;
  addSheetDefaultType: 'income' | 'expense';
  managementActiveTab: ManagementTab;
  dateFilterType: DateFilterType;
  selectedMonth: number; // 0-11
  selectedYear: number;
  customStartDate: string | null;
  customEndDate: string | null;
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
  setCustomDateRange: (start: string | null, end: string | null) => void;
  setSplitFilterMode: (mode: 'all' | 'own') => void;
}

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  isAddSheetOpen: false,
  addSheetKind: 'transaction',
  addSheetDefaultType: 'expense',
  managementActiveTab: 'category',
  dateFilterType: 'all',
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
  customStartDate: null,
  customEndDate: null,
  splitFilterMode: 'all',
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.add('theme-transitioning');
      root.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('et-theme', theme);
      if (transitionTimer) {
        clearTimeout(transitionTimer);
      }
      transitionTimer = setTimeout(() => {
        root.classList.remove('theme-transitioning');
        transitionTimer = null;
      }, 350);
    }
  },
  toggleTheme: () => {
    const isCurrentlyDark = typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : get().theme === 'dark';
    get().setTheme(isCurrentlyDark ? 'light' : 'dark');
  },
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
  setCustomDateRange: (start, end) => set({ dateFilterType: 'custom', customStartDate: start, customEndDate: end }),
  setSplitFilterMode: (mode) => set({ splitFilterMode: mode }),
}));
