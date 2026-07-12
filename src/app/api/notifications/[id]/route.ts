import { withAuth } from '@/middlewares/with-auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { notificationService } from '@/services/notification.service';

export const PATCH = withAuth(async (req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const notification = await notificationService.markRead(user.userId, id);
    if (!notification) return apiError('Notification not found.', 404);
    
    return apiSuccess({
      id: notification._id.toString(),
      recordId: notification.recordId,
      userId: notification.userId.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedId: notification.relatedId,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error('Mark read error:', err);
    return apiError('Could not update notification.', 500);
  }
});
