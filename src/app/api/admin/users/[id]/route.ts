import { NextRequest } from 'next/server';
import { withAdmin } from '@/middlewares/with-auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Category from '@/models/Category';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

// GET /api/admin/users/[id] — get a specific user's details
export const GET = withAdmin(async (_req: NextRequest, _admin: unknown, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;

  const user = await User.findById(id).select('-password');
  if (!user) return apiError('User not found.', 404);

  const [income, expense, count] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: user._id, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { userId: user._id, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.countDocuments({ userId: user._id }),
  ]);

  return apiSuccess({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    currency: user.currency,
    createdAt: user.createdAt,
    stats: {
      totalIncome: income[0]?.total ?? 0,
      totalExpense: expense[0]?.total ?? 0,
      balance: (income[0]?.total ?? 0) - (expense[0]?.total ?? 0),
      transactionCount: count,
    },
  });
});

// DELETE /api/admin/users/[id] — delete a user and all their data
export const DELETE = withAdmin(async (_req: NextRequest, admin: { userId: string }, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;

  if (id === admin.userId) return apiError('Admins cannot delete their own account from here.', 400);

  const user = await User.findById(id);
  if (!user) return apiError('User not found.', 404);

  await Promise.all([
    Transaction.deleteMany({ userId: user._id }),
    Category.deleteMany({ userId: user._id }),
    User.findByIdAndDelete(id),
  ]);

  return apiSuccess({ message: `User ${user.email} and all their data has been deleted.` });
});
