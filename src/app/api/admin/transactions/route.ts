import { NextRequest } from 'next/server';
import { withAdmin } from '@/middlewares/with-auth';
import { connectDB } from '@/lib/db';
import Transaction, { type ITransaction } from '@/models/Transaction';
import type { FilterQuery } from 'mongoose';
import { apiSuccess } from '@/lib/utils/api-response';

// GET /api/admin/transactions — list ALL users' transactions
export const GET = withAdmin(async (req: NextRequest) => {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get('userId');
  const type = searchParams.get('type') as 'income' | 'expense' | null;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = Number(searchParams.get('page') ?? 1);
  const pageSize = Number(searchParams.get('pageSize') ?? 50);

  const filter: FilterQuery<ITransaction> = {};
  if (userId) filter.userId = userId;
  if (type) filter.type = type;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .populate('category')
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Transaction.countDocuments(filter),
  ]);

  return apiSuccess({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});
