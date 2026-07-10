import { withAuth } from '@/middlewares/with-auth';
import { categoryService, CategoryError } from '@/services/category.service';
import { categorySchema } from '@/lib/validations/category.schema';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { normalizeCategoryRecord } from '@/lib/utils/normalize-management';

export const GET = withAuth(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const categories = await categoryService.list(user.userId, searchParams.get('search') ?? undefined);
    return apiSuccess(categories.map(normalizeCategoryRecord));
  } catch (err) {
    console.error('List categories error:', err);
    return apiError('Could not fetch categories.', 500);
  }
});

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    const created = await categoryService.create(user.userId, parsed.data);
    return apiSuccess(normalizeCategoryRecord(created), 201);
  } catch (err) {
    if (err instanceof CategoryError) return apiError(err.message, err.status);
    console.error('Create category error:', err);
    return apiError('Could not create category.', 500);
  }
});
