import { NextRequest } from 'next/server';
import { withAdmin } from '@/middlewares/with-auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { apiSuccess } from '@/lib/utils/api-response';

// GET /api/admin/users — list all users with their stats
export const GET = withAdmin(async (_req: NextRequest) => {
  await connectDB();

  const users = await User.find({}).select('-password').sort({ createdAt: -1 });

  const userIds = users.map((u) => String(u._id));

  // Aggregate income/expense totals per user
  const stats = await Transaction.aggregate([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    {
      $group: {
        _id: { userId: '$userId', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const statsMap: Record<string, { income: number; expense: number; count: number }> = {};
  for (const s of stats) {
    const uid = String(s._id.userId);
    if (!statsMap[uid]) statsMap[uid] = { income: 0, expense: 0, count: 0 };
    if (s._id.type === 'income') statsMap[uid].income = s.total;
    if (s._id.type === 'expense') statsMap[uid].expense = s.total;
    statsMap[uid].count += s.count;
  }

  const result = users.map((u) => {
    const uid = String(u._id);
    const s = statsMap[uid] ?? { income: 0, expense: 0, count: 0 };
    return {
      id: uid,
      name: u.name,
      email: u.email,
      role: u.role,
      currency: u.currency,
      createdAt: u.createdAt,
      stats: {
        totalIncome: s.income,
        totalExpense: s.expense,
        balance: s.income - s.expense,
        transactionCount: s.count,
      },
    };
  });

  return apiSuccess(result);
});
