import { withAuth } from '@/middlewares/with-auth';
import { categoryService } from '@/services/category.service';
import { categorySchema } from '@/lib/validations/category.schema';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

// Normalize a Mongoose category document to a plain object with `id`
function normalizeCategory(cat: {
  _id: { toString(): string };
  userId: { toString(): string };
  name: string;
  icon: string;
  color: string;
  type: string;
  isDefault: boolean;
}) {
  return {
    id: cat._id.toString(),
    userId: cat.userId.toString(),
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    type: cat.type,
    isDefault: cat.isDefault,
  };
}

export const GET = withAuth(async (_req, user) => {
  const categories = await categoryService.list(user.userId);
  return apiSuccess(categories.map(normalizeCategory));
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

  const created = await categoryService.create(user.userId, parsed.data);
  return apiSuccess(normalizeCategory(created as Parameters<typeof normalizeCategory>[0]));
});
