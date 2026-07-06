'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/format';
import type { Transaction, Category } from '@/types';
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

interface CashBookViewProps {
  transactions: Transaction[];
  currency: string;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTimeLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

interface DayGroup {
  dateKey: string;
  label: string;
  entries: Array<{ tx: Transaction; runningBalance: number }>;
  dayIncome: number;
  dayExpense: number;
  openingBalance: number;
  closingBalance: number;
}

export function CashBookView({ transactions, currency }: CashBookViewProps) {
  const { dayGroups, totalIncome, totalExpense, finalBalance } = useMemo(() => {
    // Sort oldest → newest for correct running balance
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    // Build entries with running balance
    const withBalance = sorted.map((tx) => {
      if (tx.type === 'income') {
        runningBalance += tx.amount;
        totalIncome += tx.amount;
      } else {
        runningBalance -= tx.amount;
        totalExpense += tx.amount;
      }
      return { tx, runningBalance };
    });

    // Group by date
    const map = new Map<string, typeof withBalance>();
    for (const entry of withBalance) {
      const dateKey = new Date(entry.tx.date).toISOString().slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(entry);
    }

    const dayGroups: DayGroup[] = [];
    let prevBalance = 0;

    for (const [dateKey, entries] of map.entries()) {
      const dayIncome = entries.reduce((s, e) => s + (e.tx.type === 'income' ? e.tx.amount : 0), 0);
      const dayExpense = entries.reduce((s, e) => s + (e.tx.type === 'expense' ? e.tx.amount : 0), 0);
      const closingBalance = entries[entries.length - 1]?.runningBalance ?? prevBalance;

      dayGroups.push({
        dateKey,
        label: formatDateLabel(entries[0].tx.date),
        entries,
        dayIncome,
        dayExpense,
        openingBalance: prevBalance,
        closingBalance,
      });

      prevBalance = closingBalance;
    }

    return { dayGroups, totalIncome, totalExpense, finalBalance: runningBalance };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
        <FiTrendingDown size={32} className="opacity-40" />
        <p className="text-sm">No transactions yet. Add your first entry to see the cash book.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-xs text-muted">Total Income</p>
          <p className="font-semibold text-income">{formatCurrency(totalIncome, currency)}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 border-x border-border">
          <p className="text-xs text-muted">Total Expense</p>
          <p className="font-semibold text-expense">{formatCurrency(totalExpense, currency)}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-xs text-muted">Net Balance</p>
          <p className={`font-semibold ${finalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(Math.abs(finalBalance), currency)}
          </p>
        </div>
      </div>

      {/* Day-wise cash book entries (newest day first for readability) */}
      {[...dayGroups].reverse().map((day) => (
        <div key={day.dateKey} className="overflow-hidden rounded-2xl border border-border bg-surface">
          {/* Day header */}
          <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2.5">
            <span className="text-sm font-semibold">{day.label}</span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-income">
                <FiTrendingUp size={12} /> {formatCurrency(day.dayIncome, currency)}
              </span>
              <span className="flex items-center gap-1 text-expense">
                <FiTrendingDown size={12} /> {formatCurrency(day.dayExpense, currency)}
              </span>
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 border-b border-border bg-surface/50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted">
            <span>Particulars</span>
            <span className="w-20 text-right">Method</span>
            <span className="w-24 text-right text-income">CR</span>
            <span className="w-24 text-right text-expense">DR</span>
            <span className="w-28 text-right">Balance</span>
          </div>

          {/* Opening balance row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 border-b border-border/50 px-4 py-2.5 text-xs text-muted">
            <span className="font-medium italic">Opening Balance</span>
            <span className="w-20 text-right">—</span>
            <span className="w-24 text-right">—</span>
            <span className="w-24 text-right">—</span>
            <span className="w-28 text-right font-medium">
              {formatCurrency(Math.abs(day.openingBalance), currency)}
            </span>
          </div>

          {/* Transaction rows — show newest first within the day */}
          {[...day.entries].reverse().map(({ tx, runningBalance }) => {
            const cat = tx.category as Category;
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 border-b border-border/30 px-4 py-3 text-sm transition-colors hover:bg-surface-2/50"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{tx.title}</span>
                  <span className="text-xs text-muted">
                    {cat?.name ?? '—'} · {formatTimeLabel(tx.date)}
                  </span>
                </div>
                <span className="w-20 self-center text-right text-xs capitalize text-muted">
                  {tx.paymentMethod.replace('_', ' ')}
                </span>
                <span className={`w-24 self-center text-right font-medium ${isIncome ? 'text-income' : 'text-muted opacity-30'}`}>
                  {isIncome ? formatCurrency(tx.amount, currency) : '—'}
                </span>
                <span className={`w-24 self-center text-right font-medium ${!isIncome ? 'text-expense' : 'text-muted opacity-30'}`}>
                  {!isIncome ? formatCurrency(tx.amount, currency) : '—'}
                </span>
                <span className={`w-28 self-center text-right font-semibold ${runningBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(Math.abs(runningBalance), currency)}
                </span>
              </div>
            );
          })}

          {/* Closing balance row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 bg-surface-2/40 px-4 py-2.5 text-xs">
            <span className="font-semibold">Closing Balance</span>
            <span className="w-20 text-right text-muted">—</span>
            <span className="w-24 text-right font-semibold text-income">
              {formatCurrency(day.dayIncome, currency)}
            </span>
            <span className="w-24 text-right font-semibold text-expense">
              {formatCurrency(day.dayExpense, currency)}
            </span>
            <span className={`w-28 text-right font-bold ${day.closingBalance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(Math.abs(day.closingBalance), currency)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
