import { withAuth } from '@/middlewares/with-auth';
import { apiSuccess } from '@/lib/utils/api-response';

/**
 * GET /api/auth/sessions/check
 * Heartbeat endpoint — validated by withAuth middleware against MongoDB Session collection.
 * If session was revoked from another device, withAuth returns 401 with cleared cookies.
 */
export const GET = withAuth(async () => {
  return apiSuccess({ alive: true });
});
