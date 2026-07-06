import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiError } from '@/lib/utils/api-response';

type AuthHandler<T extends unknown[]> = (
  req: NextRequest,
  user: { userId: string; email: string; role: 'user' | 'admin' },
  ...args: T
) => Promise<Response>;

/**
 * Wraps an API route handler, rejecting the request with 401 if there is no
 * valid session. The authenticated user's JWT payload is passed as the
 * second argument to the handler.
 */
export function withAuth<T extends unknown[]>(handler: AuthHandler<T>) {
  return async (req: NextRequest, ...args: T) => {
    const user = await getCurrentUser();
    if (!user) return apiError('Unauthorized. Please log in again.', 401);
    return handler(req, user, ...args);
  };
}

/**
 * Wraps an API route handler, only allowing admin users through.
 * Returns 401 if not authenticated, 403 if not admin.
 */
export function withAdmin<T extends unknown[]>(handler: AuthHandler<T>) {
  return async (req: NextRequest, ...args: T) => {
    const user = await getCurrentUser();
    if (!user) return apiError('Unauthorized. Please log in again.', 401);
    if (user.role !== 'admin') return apiError('Forbidden. Admin access required.', 403);
    return handler(req, user, ...args);
  };
}
