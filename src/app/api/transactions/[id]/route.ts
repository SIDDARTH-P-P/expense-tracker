import { withAuth } from '@/middlewares/with-auth';
import { transactionService, TransactionError } from '@/services/transaction.service';
import { transactionSchema } from '@/lib/validations/transaction.schema';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { normalizeTransaction } from '@/lib/utils/normalize-transaction';

export const GET = withAuth(async (_req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const tx = await transactionService.get(user.userId, id);
    return apiSuccess(normalizeTransaction(tx));
  } catch (err) {
    if (err instanceof TransactionError) return apiError(err.message, err.status);
    return apiError('Could not fetch transaction.', 500);
  }
});

export const PATCH = withAuth(async (req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = transactionSchema.partial().safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    const updated = await transactionService.update(user.userId, id, parsed.data);
    return apiSuccess(normalizeTransaction(updated));
  } catch (err) {
    if (err instanceof TransactionError) return apiError(err.message, err.status);
    return apiError('Could not update transaction.', 500);
  }
});

export const DELETE = withAuth(async (_req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    await transactionService.remove(user.userId, id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof TransactionError) return apiError(err.message, err.status);
    return apiError('Could not delete transaction.', 500);
  }
});
