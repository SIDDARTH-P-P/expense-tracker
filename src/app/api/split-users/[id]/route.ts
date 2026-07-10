import { withAuth } from '@/middlewares/with-auth';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { splitUserSchema } from '@/lib/validations/split-user.schema';
import { splitUserService, SplitUserError } from '@/services/split-user.service';
import { normalizeSplitUser } from '@/lib/utils/normalize-management';

export const GET = withAuth(async (_req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const splitUser = await splitUserService.get(user.userId, id);
    return apiSuccess(normalizeSplitUser(splitUser));
  } catch (err) {
    if (err instanceof SplitUserError) return apiError(err.message, err.status);
    return apiError('Could not fetch split user.', 500);
  }
});

export const PATCH = withAuth(async (req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = splitUserSchema.partial().safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    const updated = await splitUserService.update(user.userId, id, parsed.data);
    return apiSuccess(normalizeSplitUser(updated));
  } catch (err) {
    if (err instanceof SplitUserError) return apiError(err.message, err.status);
    return apiError('Could not update split user.', 500);
  }
});

export const PUT = PATCH;

export const DELETE = withAuth(async (_req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    await splitUserService.remove(user.userId, id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof SplitUserError) return apiError(err.message, err.status);
    return apiError('Could not delete split user.', 500);
  }
});
