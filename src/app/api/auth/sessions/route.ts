import { NextRequest } from 'next/server';
import { getCurrentUser, getSessionId } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import { notificationService } from '@/services/notification.service';

// GET /api/auth/sessions — list all sessions for the current user
export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) return apiError('Unauthorized', 401);

  await connectDB();

  const currentSessionId = await getSessionId(req);

  const sessions = await Session.find({ userId: currentUser.userId })
    .sort({ lastSeenAt: -1 })
    .lean();

  const data = sessions.map((s) => ({
    id: String(s._id),
    sessionId: s.sessionId,
    deviceName: s.deviceName,
    os: s.os,
    browser: s.browser,
    ip: s.ip,
    location: s.location,
    loginAt: s.loginAt,
    lastSeenAt: s.lastSeenAt,
    isCurrent: s.sessionId === currentSessionId,
  }));

  return apiSuccess(data);
}

// DELETE /api/auth/sessions — revoke ALL sessions except current
export async function DELETE(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) return apiError('Unauthorized', 401);

  await connectDB();
  const currentSessionId = await getSessionId(req);

  await Session.deleteMany({
    userId: currentUser.userId,
    ...(currentSessionId ? { sessionId: { $ne: currentSessionId } } : {}),
  });

  // Realtime notification push to all other devices
  notificationService.broadcastSessionRevoked(currentUser.userId, {
    revokeAllOthers: true,
    currentSessionId: currentSessionId ?? undefined,
  });

  return apiSuccess({ revokedAll: true });
}
