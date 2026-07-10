import { transactionRepository } from '@/repositories/transaction.repository';
import { categoryRepository } from '@/repositories/category.repository';
import { generateRecordId } from '@/lib/generateRecordId';
import type { ITransaction } from '@/models/Transaction';
import type { ICategory } from '@/models/Category';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function sumByType(txs: ITransaction[], type: 'income' | 'expense') {
  return txs.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export const dashboardService = {
  async getSummary(userId: string) {
    const [missingTransactions, missingCategories] = await Promise.all([
      transactionRepository.findMissingRecordIds(userId),
      categoryRepository.findMissingRecordIds(userId),
    ]);

    await Promise.all([
      ...missingTransactions.map(async (transaction) =>
        transactionRepository.setRecordId(
          String(transaction._id),
          await generateRecordId(transaction.type === 'income' ? 'INC' : 'EXP')
        )
      ),
      ...missingCategories.map(async (category) =>
        categoryRepository.setRecordId(String(category._id), await generateRecordId('CAT'))
      ),
    ]);

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);
    const sixMonthsAgo = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1));

    const [allTxs, thisMonthTxs, lastMonthTxs, trendTxs, todayTxs] = await Promise.all([
      transactionRepository.findAllByUser(userId),
      transactionRepository.findInRange(userId, thisMonthStart, thisMonthEnd),
      transactionRepository.findInRange(userId, lastMonthStart, lastMonthEnd),
      transactionRepository.findInRange(userId, sixMonthsAgo, thisMonthEnd),
      transactionRepository.findInRange(userId, startOfDay(now), endOfDay(now)),
    ]);

    const totalIncome = sumByType(allTxs, 'income');
    const totalExpense = sumByType(allTxs, 'expense');
    const monthlyIncome = sumByType(thisMonthTxs, 'income');
    const monthlyExpense = sumByType(thisMonthTxs, 'expense');
    const lastMonthIncome = sumByType(lastMonthTxs, 'income');
    const lastMonthExpense = sumByType(lastMonthTxs, 'expense');

    // Top spending categories this month
    const categoryTotals = new Map<string, { category: ICategory; total: number }>();
    thisMonthTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category as unknown as ICategory;
        const key = String(cat._id);
        const existing = categoryTotals.get(key);
        if (existing) existing.total += t.amount;
        else categoryTotals.set(key, { category: cat, total: t.amount });
      });
    const topCategories = [...categoryTotals.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((c) => ({ ...c, percent: monthlyExpense > 0 ? (c.total / monthlyExpense) * 100 : 0 }));

    // 6-month trend
    const trendMap = new Map<string, { income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short' });
      trendMap.set(key, { income: 0, expense: 0 });
    }
    trendTxs.forEach((t) => {
      const key = new Date(t.date).toLocaleString('en-US', { month: 'short' });
      const bucket = trendMap.get(key);
      if (bucket) {
        if (t.type === 'income') bucket.income += t.amount;
        else bucket.expense += t.amount;
      }
    });
    const monthlyTrend = [...trendMap.entries()].map(([month, v]) => ({ month, ...v }));

    const recentTransactions = [...allTxs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    return {
      totalBalance: totalIncome - totalExpense,
      monthlyIncome,
      monthlyExpense,
      monthlySavings: monthlyIncome - monthlyExpense,
      todaySpending: sumByType(todayTxs, 'expense'),
      incomeChangePct: pctChange(monthlyIncome, lastMonthIncome),
      expenseChangePct: pctChange(monthlyExpense, lastMonthExpense),
      recentTransactions,
      topCategories,
      monthlyTrend,
    };
  },
};
