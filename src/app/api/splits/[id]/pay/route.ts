import { withAuth } from '@/middlewares/with-auth';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { splitService, SplitError } from '@/services/split.service';
import { normalizeSplit } from '@/lib/utils/normalize-management';

export const POST = withAuth(async (req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const { memberId } = body;
    if (!memberId) return apiError('Member ID is required.', 422);

    const updated = await splitService.markPaid(user.userId, id, memberId);
    return apiSuccess(normalizeSplit(updated));
  } catch (err) {
    if (err instanceof SplitError) return apiError(err.message, err.status);
    console.error('Mark split paid error:', err);
    return apiError('Could not process payment settlement.', 500);
  }
});
