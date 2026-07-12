import { withAuth } from '@/middlewares/with-auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { notificationService } from '@/services/notification.service';

export const GET = withAuth(async (req, user) => {
  try {
    const notifications = await notificationService.list(user.userId);
    const normalized = notifications.map((n) => ({
      id: n._id.toString(),
      recordId: n.recordId,
      userId: n.userId.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      relatedId: n.relatedId,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));
    return apiSuccess(normalized);
  } catch (err) {
    console.error('List notifications error:', err);
    return apiError('Could not fetch notifications.', 500);
  }
});

export const POST = withAuth(async (req, user) => {
  try {
    await notificationService.markAllRead(user.userId);
    return apiSuccess({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    return apiError('Could not mark all notifications as read.', 500);
  }
});
