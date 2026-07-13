import { withAuth } from '@/middlewares/with-auth';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { splitService, SplitError } from '@/services/split.service';
import { normalizeSplit } from '@/lib/utils/normalize-management';

export const POST = withAuth(async (req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;

    const updated = await splitService.sendReminder(user.userId, id);
    return apiSuccess(normalizeSplit(updated));
  } catch (err) {
    if (err instanceof SplitError) return apiError(err.message, err.status);
    console.error('Send split reminder error:', err);
    return apiError('Could not send reminder.', 500);
  }
});
