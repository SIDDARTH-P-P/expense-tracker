import type { Category, PaginatedResult, PaymentMethod, Transaction, TransactionType } from '@/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toPlainObject(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};

  const maybeToObject = value.toObject;
  if (typeof maybeToObject === 'function') {
    const plain = maybeToObject.call(value);
    return isRecord(plain) ? plain : {};
  }

  return value;
}

function stringifyId(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (isRecord(value) && typeof value.toString === 'function') return value.toString();
  return '';
}

function stringifyDate(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return '';
}

function normalizeType(value: unknown): TransactionType {
  return value === 'income' ? 'income' : 'expense';
}

function normalizePaymentMethod(value: unknown): PaymentMethod {
  if (value === 'cash' || value === 'card' || value === 'upi' || value === 'bank_transfer' || value === 'other') {
    return value;
  }
  return 'cash';
}

export function normalizeCategory(value: unknown): Category | string {
  if (typeof value === 'string') return value;

  const category = toPlainObject(value);
  const id = stringifyId(category.id ?? category._id);

  if (!id && !category.name) {
    return stringifyId(value);
  }

  return {
    id,
    recordId: typeof category.recordId === 'string' ? category.recordId : id,
    userId: stringifyId(category.userId),
    name: typeof category.name === 'string' ? category.name : '',
    icon: typeof category.icon === 'string' ? category.icon : 'FiTag',
    color: typeof category.color === 'string' ? category.color : '#888888',
    type: category.type === 'income' || category.type === 'expense' || category.type === 'both' ? category.type : 'expense',
    subcategories: Array.isArray(category.subcategories)
      ? category.subcategories.map((sub: any) => ({
          id: stringifyId(sub._id || sub.id),
          name: typeof sub.name === 'string' ? sub.name : '',
        }))
      : [],
    isDefault: Boolean(category.isDefault),
  };
}

export function normalizeTransaction(value: unknown): Transaction {
  const transaction = toPlainObject(value);

  return {
    id: stringifyId(transaction.id ?? transaction._id),
    recordId: typeof transaction.recordId === 'string' ? transaction.recordId : stringifyId(transaction.id ?? transaction._id),
    userId: stringifyId(transaction.userId),
    title: typeof transaction.title === 'string' ? transaction.title : '',
    amount: typeof transaction.amount === 'number' ? transaction.amount : Number(transaction.amount ?? 0),
    type: normalizeType(transaction.type),
    category: normalizeCategory(transaction.category),
    subCategory: typeof transaction.subCategory === 'string' ? transaction.subCategory : null,
    paymentMethod: normalizePaymentMethod(transaction.paymentMethod),
    date: stringifyDate(transaction.date),
    note: typeof transaction.note === 'string' ? transaction.note : undefined,
    splitId: transaction.splitId ? stringifyId(transaction.splitId) : null,
    splitRecordId: typeof transaction.splitRecordId === 'string' ? transaction.splitRecordId : null,
    splitMembersCount: typeof transaction.splitMembersCount === 'number' ? transaction.splitMembersCount : null,
    createdFrom: typeof transaction.createdFrom === 'string' ? transaction.createdFrom : null,
    createdBy: transaction.createdBy ? stringifyId(transaction.createdBy) : null,
    transactionType: transaction.transactionType === 'Split Expense' || transaction.transactionType === 'Split Income' || transaction.transactionType === 'Split Settlement' ? transaction.transactionType : null,
    status: transaction.status === 'Pending' ? 'Pending' : 'Paid',
    createdAt: stringifyDate(transaction.createdAt),
    updatedAt: stringifyDate(transaction.updatedAt),
  };
}

export function normalizePaginatedTransactions<T extends PaginatedResult<unknown>>(
  result: T
): Omit<T, 'items'> & { items: Transaction[] } {
  const items = Array.isArray(result.items) ? result.items : [];

  return {
    ...result,
    items: items.map(normalizeTransaction),
    totalPages: Number.isFinite(result.totalPages) ? result.totalPages : 0,
  };
}
