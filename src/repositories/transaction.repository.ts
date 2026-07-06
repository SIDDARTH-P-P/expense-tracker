import { connectDB } from '@/lib/db';
import Transaction, { type ITransaction } from '@/models/Transaction';
import type { FilterQuery } from 'mongoose';

export interface TransactionQueryOptions {
  search?: string;
  type?: 'income' | 'expense';
  category?: string;
  from?: string;
  to?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const transactionRepository = {
  async findAllForUser(userId: string, opts: TransactionQueryOptions = {}) {
    await connectDB();
    const {
      search,
      type,
      category,
      from,
      to,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20,
    } = opts;

    const filter: FilterQuery<ITransaction> = { userId };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .populate('category')
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      Transaction.countDocuments(filter),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async findById(id: string, userId: string) {
    await connectDB();
    return Transaction.findOne({ _id: id, userId }).populate('category');
  },

  async create(data: Partial<ITransaction>) {
    await connectDB();
    const doc = await Transaction.create(data);
    return doc.populate('category');
  },

  async updateById(id: string, userId: string, data: Partial<ITransaction>) {
    await connectDB();
    return Transaction.findOneAndUpdate({ _id: id, userId }, data, {
      new: true,
      runValidators: true,
    }).populate('category');
  },

  async deleteById(id: string, userId: string) {
    await connectDB();
    return Transaction.findOneAndDelete({ _id: id, userId });
  },

  async findInRange(userId: string, from: Date, to: Date) {
    await connectDB();
    return Transaction.find({ userId, date: { $gte: from, $lte: to } }).populate('category');
  },
};
