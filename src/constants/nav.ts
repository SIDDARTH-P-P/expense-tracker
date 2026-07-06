import { FiHome, FiList, FiPieChart, FiSettings, FiUser } from 'react-icons/fi';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: FiHome },
  { href: '/transactions', label: 'Transactions', icon: FiList },
  { href: '/categories', label: 'Insights', icon: FiPieChart },
  { href: '/settings', label: 'Settings', icon: FiSettings },
  { href: '/profile', label: 'Profile', icon: FiUser },
] as const;
