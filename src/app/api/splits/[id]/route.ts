import { withAuth } from '@/middlewares/with-auth';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { splitSchema } from '@/lib/validations/split.schema';
import { splitService, SplitError } from '@/services/split.service';
import { normalizeSplit } from '@/lib/utils/normalize-management';

export const GET = withAuth(async (_req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const split = await splitService.get(user.userId, id);
    return apiSuccess(normalizeSplit(split));
  } catch (err) {
    if (err instanceof SplitError) return apiError(err.message, err.status);
    return apiError('Could not fetch split.', 500);
  }
});

export const PATCH = withAuth(async (req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = splitSchema.partial().safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    const updated = await splitService.update(user.userId, id, parsed.data);
    return apiSuccess(normalizeSplit(updated));
  } catch (err) {
    if (err instanceof SplitError) return apiError(err.message, err.status);
    return apiError('Could not update split.', 500);
  }
});

export const PUT = PATCH;

export const DELETE = withAuth(async (_req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    await splitService.remove(user.userId, id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof SplitError) return apiError(err.message, err.status);
    return apiError('Could not delete split.', 500);
  }
});
