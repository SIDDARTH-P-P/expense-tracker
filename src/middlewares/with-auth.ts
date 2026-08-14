import { NextRequest } from 'next/server';
import { getCurrentUser, getSessionId } from '@/lib/auth';
import { apiError } from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';

type AuthHandler<T extends unknown[]> = (
  req: NextRequest,
  user: { userId: string; email: string; role: 'user' | 'admin' },
  ...args: T
) => Promise<Response>;

/**
 * Helper to build 401 Unauthorized response with cleared cookies.
 */
function createUnauthorizedResponse(message = 'Unauthorized. Please log in again.') {
  const res = apiError(message, 401);
  res.headers.append('Set-Cookie', 'et_access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  res.headers.append('Set-Cookie', 'et_refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  res.headers.append('Set-Cookie', 'et_session_id=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  return res;
}

/**
 * Wraps an API route handler, rejecting the request with 401 if there is no
 * valid session in JWT AND active in MongoDB.
 */
export function withAuth<T extends unknown[]>(handler: AuthHandler<T>) {
  return async (req: NextRequest, ...args: T) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Verify session ID exists in DB
    const sessionId = await getSessionId(req);
    if (sessionId) {
      await connectDB();
      const activeSession = await Session.findOne({ sessionId, userId: user.userId }).lean();
      if (!activeSession) {
        return createUnauthorizedResponse('Your session was revoked from another device.');
      }
    }

    return handler(req, user, ...args);
  };
}

/**
 * Wraps an API route handler, only allowing admin users through.
 */
export function withAdmin<T extends unknown[]>(handler: AuthHandler<T>) {
  return async (req: NextRequest, ...args: T) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return createUnauthorizedResponse();
    }

    const sessionId = await getSessionId(req);
    if (sessionId) {
      await connectDB();
      const activeSession = await Session.findOne({ sessionId, userId: user.userId }).lean();
      if (!activeSession) {
        return createUnauthorizedResponse('Your session was revoked from another device.');
      }
    }

    if (user.role !== 'admin') return apiError('Forbidden. Admin access required.', 403);
    return handler(req, user, ...args);
  };
}
