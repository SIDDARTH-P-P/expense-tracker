import { Types } from 'mongoose';
import { transactionRepository, type TransactionQueryOptions } from '@/repositories/transaction.repository';
import { categoryRepository } from '@/repositories/category.repository';
import { connectDB } from '@/lib/db';
import Category from '@/models/Category';

export class TransactionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface TransactionInput {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  date: string;
  note?: string;
}

function parseDate(dateStr: string): Date {
  // Accept both 'YYYY-MM-DDTHH:mm' (datetime-local) and full ISO strings
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new TransactionError('Invalid date format.', 400);
  return d;
}

export const transactionService = {
  async list(userId: string, opts: TransactionQueryOptions) {
    return transactionRepository.findAllForUser(userId, opts);
  },

  async get(userId: string, id: string) {
    const tx = await transactionRepository.findById(id, userId);
    if (!tx) throw new TransactionError('Transaction not found.', 404);
    return tx;
  },

  async create(userId: string, input: TransactionInput) {
    await connectDB();
    // Validate category exists and belongs to this user (or is a system default)
    const category = await Category.findOne({
      _id: input.category,
      userId: new Types.ObjectId(userId),
    });
    if (!category) {
      throw new TransactionError('Invalid category. Please select a valid category from the list.', 400);
    }

    return transactionRepository.create({
      ...input,
      userId: new Types.ObjectId(userId),
      category: new Types.ObjectId(input.category),
      date: parseDate(input.date),
    });
  },

  async duplicate(userId: string, id: string) {
    const original = await transactionRepository.findById(id, userId);
    if (!original) throw new TransactionError('Transaction not found.', 404);
    return transactionRepository.create({
      userId: original.userId,
      title: `${original.title} (copy)`,
      amount: original.amount,
      type: original.type,
      category: original.category as never,
      paymentMethod: original.paymentMethod,
      date: new Date(),
      note: original.note,
    });
  },

  async update(userId: string, id: string, input: Partial<TransactionInput>) {
    const { category, date, ...rest } = input;
    const updated = await transactionRepository.updateById(id, userId, {
      ...rest,
      ...(category ? { category: new Types.ObjectId(category) } : {}),
      ...(date ? { date: parseDate(date) } : {}),
    });
    if (!updated) throw new TransactionError('Transaction not found.', 404);
    return updated;
  },

  async remove(userId: string, id: string) {
    const deleted = await transactionRepository.deleteById(id, userId);
    if (!deleted) throw new TransactionError('Transaction not found.', 404);
    return deleted;
  },
};
