import { NextRequest } from 'next/server';
import { getCurrentUser, getSessionId } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import { notificationService } from '@/services/notification.service';
import mongoose from 'mongoose';

// DELETE /api/auth/sessions/[id] — revoke a specific session by _id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) return apiError('Unauthorized', 401);

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return apiError('Invalid session ID', 400);
  }

  await connectDB();

  const currentSessionId = await getSessionId(req);

  const session = await Session.findOne({ _id: id, userId: currentUser.userId });
  if (!session) return apiError('Session not found', 404);

  // Prevent revoking the current session via this endpoint (use /logout instead)
  if (session.sessionId === currentSessionId) {
    return apiError('Use the logout endpoint to end your current session', 400);
  }

  const revokedSessionId = session.sessionId;
  await session.deleteOne();

  // Realtime notification push to target revoked device
  notificationService.broadcastSessionRevoked(currentUser.userId, { revokedSessionId });

  return apiSuccess({ revoked: true, id });
}
