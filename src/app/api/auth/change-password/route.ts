import { NextRequest } from 'next/server';
import { withAuth } from '@/middlewares/with-auth';
import { authService, AuthError } from '@/services/auth.service';
import { changePasswordSchema } from '@/lib/validations/auth.schema';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    await authService.changePassword(user.userId, parsed.data.currentPassword, parsed.data.newPassword);
    return apiSuccess({ updated: true });
  } catch (err) {
    if (err instanceof AuthError) return apiError(err.message, err.status);
    console.error('Change password error:', err);
    return apiError('Could not update password.', 500);
  }
});
