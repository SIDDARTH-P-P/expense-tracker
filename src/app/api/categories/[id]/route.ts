import { withAuth } from '@/middlewares/with-auth';
import { categoryService, CategoryError } from '@/services/category.service';
import { categorySchema } from '@/lib/validations/category.schema';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export const PATCH = withAuth(async (req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    const updated = await categoryService.update(user.userId, id, parsed.data);
    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof CategoryError) return apiError(err.message, err.status);
    return apiError('Could not update category.', 500);
  }
});

export const DELETE = withAuth(async (_req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    await categoryService.remove(user.userId, id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof CategoryError) return apiError(err.message, err.status);
    return apiError('Could not delete category.', 500);
  }
});
