export interface NotebookColorPalette {
  bg: string;
  text: string;
  border: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
}

export const BOOK_PALETTES: NotebookColorPalette[] = [
  {
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    icon: '📘',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: '📗',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    bg: 'bg-amber-500/15 dark:bg-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    icon: '📙',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
  {
    bg: 'bg-rose-500/15 dark:bg-rose-500/25',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    icon: '📕',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-600 dark:text-rose-400',
  },
  {
    bg: 'bg-purple-500/15 dark:bg-purple-500/25',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
    icon: '📓',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-600 dark:text-purple-400',
  },
  {
    bg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20',
    icon: '📔',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    bg: 'bg-pink-500/15 dark:bg-pink-500/25',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/20',
    icon: '📒',
    badgeBg: 'bg-pink-500/10',
    badgeText: 'text-pink-600 dark:text-pink-400',
  },
  {
    bg: 'bg-sky-500/15 dark:bg-sky-500/25',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/20',
    icon: '📑',
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-600 dark:text-sky-400',
  },
  {
    bg: 'bg-teal-500/15 dark:bg-teal-500/25',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/20',
    icon: '📚',
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-600 dark:text-teal-400',
  },
  {
    bg: 'bg-violet-500/15 dark:bg-violet-500/25',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/20',
    icon: '🔖',
    badgeBg: 'bg-violet-500/10',
    badgeText: 'text-violet-600 dark:text-violet-400',
  },
];

export function getNotebookPalette(name?: string, id?: string): NotebookColorPalette {
  const str = (name ?? '') + (id ?? '');
  if (!str) return BOOK_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BOOK_PALETTES.length;
  return BOOK_PALETTES[index];
}
