import { withAuth } from '@/middlewares/with-auth';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { splitUserSchema } from '@/lib/validations/split-user.schema';
import { splitUserService, SplitUserError } from '@/services/split-user.service';
import { normalizeSplitUser } from '@/lib/utils/normalize-management';

export const GET = withAuth(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const splitUsers = await splitUserService.list(user.userId, searchParams.get('search') ?? undefined);
    return apiSuccess(splitUsers.map(normalizeSplitUser));
  } catch (err) {
    console.error('List split users error:', err);
    return apiError('Could not fetch split users.', 500);
  }
});

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json();
    const parsed = splitUserSchema.safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    const created = await splitUserService.create(user.userId, parsed.data);
    return apiSuccess(normalizeSplitUser(created), 201);
  } catch (err) {
    if (err instanceof SplitUserError) return apiError(err.message, err.status);
    console.error('Create split user error:', err);
    return apiError('Could not create split user.', 500);
  }
});
