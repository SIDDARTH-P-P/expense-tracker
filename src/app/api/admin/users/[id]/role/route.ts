import { NextRequest } from 'next/server';
import { withAdmin } from '@/middlewares/with-auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

// PATCH /api/admin/users/[id]/role — change a user's role
export const PATCH = withAdmin(async (req: NextRequest, _admin: unknown, { params }: { params: Promise<{ id: string }> }) => {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { role } = body;

  if (!['user', 'admin'].includes(role)) {
    return apiError('Invalid role. Must be "user" or "admin".', 400);
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) return apiError('User not found.', 404);

  return apiSuccess({ id: String(user._id), name: user.name, email: user.email, role: user.role });
});
