import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './format';
import type { Transaction, Category } from '@/types';

function toRows(transactions: Transaction[], currency: string) {
  return transactions.map((t) => ({
    Date: formatDate(t.date, 'long'),
    Title: t.title,
    Category: (t.category as Category).name,
    Type: t.type,
    'Payment Method': t.paymentMethod,
    Amount: formatCurrency(t.amount, currency),
    Note: t.note ?? '',
  }));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(transactions: Transaction[], currency: string) {
  const csv = Papa.unparse(toRows(transactions, currency));
  download(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `transactions-${Date.now()}.csv`);
}

export function exportTransactionsToExcel(transactions: Transaction[], currency: string) {
  const worksheet = XLSX.utils.json_to_sheet(toRows(transactions, currency));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, `transactions-${Date.now()}.xlsx`);
}
