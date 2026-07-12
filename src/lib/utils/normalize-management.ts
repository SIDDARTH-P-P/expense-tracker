import type { Category, Split, SplitMember, SplitUser } from '@/types';

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

export function normalizeCategoryRecord(value: unknown): Category {
  const category = toPlainObject(value);
  const id = stringifyId(category.id ?? category._id);

  return {
    id,
    recordId: typeof category.recordId === 'string' ? category.recordId : id,
    userId: stringifyId(category.userId),
    name: typeof category.name === 'string' ? category.name : '',
    icon: typeof category.icon === 'string' ? category.icon : 'FiTag',
    color: typeof category.color === 'string' ? category.color : '#2DD4BF',
    type: category.type === 'income' || category.type === 'expense' || category.type === 'both' ? category.type : 'expense',
    subcategories: Array.isArray(category.subcategories)
      ? category.subcategories.map((sub: any) => ({
          id: stringifyId(sub._id || sub.id),
          name: typeof sub.name === 'string' ? sub.name : '',
        }))
      : [],
    isDefault: Boolean(category.isDefault),
    createdAt: stringifyDate(category.createdAt),
    updatedAt: stringifyDate(category.updatedAt),
  };
}

export function normalizeSplitUser(value: unknown): SplitUser {
  const splitUser = toPlainObject(value);
  const id = stringifyId(splitUser.id ?? splitUser._id);

  return {
    id,
    recordId: typeof splitUser.recordId === 'string' ? splitUser.recordId : id,
    userId: stringifyId(splitUser.userId),
    name: typeof splitUser.name === 'string' ? splitUser.name : '',
    email: typeof splitUser.email === 'string' ? splitUser.email : '',
    createdAt: stringifyDate(splitUser.createdAt),
    updatedAt: stringifyDate(splitUser.updatedAt),
  };
}

function normalizeSplitMember(value: unknown): SplitMember {
  const member = toPlainObject(value);
  const userValue = member.userId;
  const userRecord = toPlainObject(userValue);
  const userId = userRecord.name || userRecord.email ? normalizeSplitUser(userValue) : stringifyId(userValue);

  return {
    userId,
    shareAmount: typeof member.shareAmount === 'number' ? member.shareAmount : Number(member.shareAmount ?? 0),
    paid: Boolean(member.paid),
  };
}

export function normalizeSplit(value: unknown): Split {
  const split = toPlainObject(value);
  const id = stringifyId(split.id ?? split._id);
  const paidByRecord = toPlainObject(split.paidBy);
  const paidBy = paidByRecord.name || paidByRecord.email ? normalizeSplitUser(split.paidBy) : stringifyId(split.paidBy);
  const members = Array.isArray(split.members) ? split.members.map(normalizeSplitMember) : [];

  return {
    id,
    recordId: typeof split.recordId === 'string' ? split.recordId : id,
    userId: stringifyId(split.userId),
    title: typeof split.title === 'string' ? split.title : '',
    amount: typeof split.amount === 'number' ? split.amount : Number(split.amount ?? 0),
    paidBy,
    splitMode: split.splitMode === 'custom' ? 'custom' : 'equal',
    members,
    status: (split.status || 'Pending') as 'Pending' | 'Partially Paid' | 'Completed',
    deleted: Boolean(split.deleted),
    createdAt: stringifyDate(split.createdAt),
    updatedAt: stringifyDate(split.updatedAt),
  };
}
