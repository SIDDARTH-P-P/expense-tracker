'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import * as Icons from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';
import type { Transaction, Category } from '@/types';
import { useUIStore } from '@/store/ui.store';

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency: string;
  showHeader?: boolean;
}

// Preset color maps matching the screenshot's exact pastel circle icons
const CATEGORY_THEMES: Record<string, { bg: string; text: string; icon: IconType }> = {
  groceries: { bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400', icon: Icons.FiShoppingCart },
  entertainment: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400', icon: Icons.FiFilm },
  transportation: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400', icon: Icons.FiCompass },
  rent: { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400', icon: Icons.FiHome },
  food: { bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-600 dark:text-orange-400', icon: Icons.FiCoffee },
  shopping: { bg: 'bg-pink-100 dark:bg-pink-950/60', text: 'text-pink-600 dark:text-pink-400', icon: Icons.FiShoppingBag },
  bills: { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400', icon: Icons.FiFileText },
  travel: { bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-600 dark:text-cyan-400', icon: Icons.FiMapPin },
};

function getCategoryTheme(categoryName?: string) {
  if (!categoryName) return CATEGORY_THEMES.groceries;
  const key = categoryName.toLowerCase().trim();
  if (CATEGORY_THEMES[key]) return CATEGORY_THEMES[key];

  if (key.includes('food') || key.includes('cafe')) return CATEGORY_THEMES.food;
  if (key.includes('shop') || key.includes('store')) return CATEGORY_THEMES.shopping;
  if (key.includes('bill') || key.includes('utility')) return CATEGORY_THEMES.bills;
  if (key.includes('travel') || key.includes('trip')) return CATEGORY_THEMES.travel;

  return CATEGORY_THEMES.groceries;
}

export function RecentTransactions({
  transactions,
  currency,
  showHeader = true,
}: RecentTransactionsProps) {
  const openAddSheet = useUIStore((s) => s.openAddSheet);
  const hasTransactions = transactions && transactions.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Header section matching screenshot */}
      {showHeader && (
        <div className="flex items-center justify-between px-1 shrink-0">
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
            Recent Expenses
          </h3>
          <Link
            href="/transactions"
            className="text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            see all
          </Link>
        </div>
      )}

      {/* Expense List */}
      <div className="flex flex-col gap-3 pb-2">
        {hasTransactions ? (
          transactions.map((tx, idx) => {
            const category = tx.category as Category;
            const catName = category?.name ?? tx.title;
            const theme = getCategoryTheme(catName);

            const IconComponent =
              category?.icon && Icons[category.icon as keyof typeof Icons]
                ? (Icons[category.icon as keyof typeof Icons] as IconType)
                : theme.icon;

            const isIncome = tx.type === 'income';
            const formattedTime = formatRelativeDate(tx.date);

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="flex items-center justify-between rounded-[20px] border border-border/60 bg-surface p-3.5 shadow-soft transition-all hover:shadow-card hover:border-border shrink-0"
              >
                <div className="flex items-center gap-3.5">
                  {/* Circle Pastel Icon Badge */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${theme.bg} ${theme.text}`}
                  >
                    <IconComponent size={20} />
                  </div>
                  {/* Title + Subtitle */}
                  <div>
                    <p className="font-bold text-sm text-foreground">{catName}</p>
                    <p className="text-xs text-muted font-normal">
                      {tx.paymentMethod ? tx.paymentMethod.charAt(0).toUpperCase() + tx.paymentMethod.slice(1) : 'Manually'}
                    </p>
                  </div>
                </div>

                {/* Amount + Timestamp */}
                <div className="text-right">
                  <p className={`font-bold text-sm sm:text-base ${isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    {isIncome ? '+' : '−'} {formatCurrency(tx.amount, currency)}
                  </p>
                  <p className="text-xs text-muted font-normal">{formattedTime}</p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-8 rounded-[24px] border border-border/60 bg-surface/60 backdrop-blur-md my-2"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
              <Icons.FiPlusCircle size={26} />
            </div>
            <h4 className="font-bold text-base text-foreground">No transactions yet</h4>
            <p className="mt-1 text-xs text-muted max-w-xs mb-5">
              Start recording your income and expenses to track your balance and spending habits.
            </p>
            <button
              type="button"
              onClick={() => openAddSheet('expense')}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-98"
            >
              <Icons.FiPlus size={16} />
              <span>Add Transaction</span>
            </button>
          </motion.div>
        )}

        {hasTransactions && (
          <div className="py-2 flex justify-center">
            <Link
              href="/transactions"
              className="group flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-surface/90 hover:bg-surface px-5 py-2.5 text-xs sm:text-sm font-semibold text-foreground shadow-soft hover:shadow-card transition-all"
            >
              <span>View All Transactions</span>
              <Icons.FiArrowRight size={16} className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

