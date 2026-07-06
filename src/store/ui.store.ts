import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  isAddSheetOpen: boolean;
  addSheetDefaultType: 'income' | 'expense';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  openAddSheet: (type?: 'income' | 'expense') => void;
  closeAddSheet: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  isAddSheetOpen: false,
  addSheetDefaultType: 'expense',
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('et-theme', theme);
    }
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
  openAddSheet: (type = 'expense') => set({ isAddSheetOpen: true, addSheetDefaultType: type }),
  closeAddSheet: () => set({ isAddSheetOpen: false }),
}));
