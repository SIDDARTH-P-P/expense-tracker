import { withAuth } from '@/middlewares/with-auth';
import { apiError, apiSuccess } from '@/lib/utils/api-response';
import { splitSchema } from '@/lib/validations/split.schema';
import { splitService, SplitError } from '@/services/split.service';
import { normalizeSplit } from '@/lib/utils/normalize-management';

export const GET = withAuth(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const splits = await splitService.list(user.userId, searchParams.get('search') ?? undefined);
    return apiSuccess(splits.map(normalizeSplit));
  } catch (err) {
    console.error('List splits error:', err);
    return apiError('Could not fetch splits.', 500);
  }
});

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json();
    const parsed = splitSchema.safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    const created = await splitService.create(user.userId, parsed.data);
    return apiSuccess(normalizeSplit(created), 201);
  } catch (err) {
    if (err instanceof SplitError) return apiError(err.message, err.status);
    console.error('Create split error:', err);
    return apiError('Could not create split.', 500);
  }
});
