/** Seeded on signup so every new user starts with a sensible category set. */
export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'FiCoffee', color: '#F5A623', type: 'expense' },
  { name: 'Shopping', icon: 'FiShoppingBag', color: '#FB7185', type: 'expense' },
  { name: 'Bills', icon: 'FiFileText', color: '#818CF8', type: 'expense' },
  { name: 'Entertainment', icon: 'FiFilm', color: '#F472B6', type: 'expense' },
  { name: 'Travel', icon: 'FiMapPin', color: '#38BDF8', type: 'expense' },
  { name: 'Medical', icon: 'FiHeart', color: '#FB923C', type: 'expense' },
  { name: 'Education', icon: 'FiBook', color: '#A78BFA', type: 'expense' },
  { name: 'Others', icon: 'FiGrid', color: '#94A3B8', type: 'both' },
  { name: 'Salary', icon: 'FiBriefcase', color: '#2DD4BF', type: 'income' },
  { name: 'Investment', icon: 'FiTrendingUp', color: '#34D399', type: 'income' },
] as const;
