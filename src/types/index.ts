export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  theme: 'light' | 'dark';
  language: string;
  role: 'user' | 'admin';
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  recordId: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
  isDefault: boolean;
  subcategories: SubCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  recordId: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  subCategory?: string | null;
  paymentMethod: PaymentMethod;
  date: string;
  note?: string;
  splitId?: string | null;
  splitRecordId?: string | null;
  splitMembersCount?: number | null;
  createdFrom?: string | null;
  createdBy?: string | null;
  transactionType?: 'Split Expense' | 'Split Income' | 'Split Settlement' | null;
  status: 'Paid' | 'Pending';
  createdAt: string;
  updatedAt: string;
}

export interface SplitUser {
  id: string;
  recordId: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type SplitMode = 'equal' | 'custom';

export interface SplitMember {
  userId: SplitUser | string;
  shareAmount: number;
  paid: boolean;
}

export interface Split {
  id: string;
  recordId: string;
  userId: string;
  title: string;
  amount: number;
  paidBy: SplitUser | string;
  splitMode: SplitMode;
  members: SplitMember[];
  status: 'Pending' | 'Partially Paid' | 'Completed';
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  todaySpending: number;
  incomeChangePct: number;
  expenseChangePct: number;
  recentTransactions: Transaction[];
  topCategories: { category: Category; total: number; percent: number }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Notification {
  id: string;
  recordId: string;
  userId: string;
  title: string;
  message: string;
  type: 'Split Created' | 'Split Paid' | 'Split Reminder' | 'Expense' | 'Income' | 'System';
  relatedId?: string | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
