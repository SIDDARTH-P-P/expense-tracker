import { getCurrentUser } from '@/lib/auth';
import { userRepository } from '@/repositories/user.repository';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return apiError('Unauthorized.', 401);

  const user = await userRepository.findById(session.userId);
  if (!user) return apiError('User not found.', 404);

  return apiSuccess({
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    currency: user.currency,
    theme: user.theme,
    language: user.language,
    role: user.role ?? 'user',
  });
}
