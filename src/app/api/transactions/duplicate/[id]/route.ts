import { withAuth } from '@/middlewares/with-auth';
import { transactionService, TransactionError } from '@/services/transaction.service';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { normalizeTransaction } from '@/lib/utils/normalize-transaction';

export const POST = withAuth(async (_req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    const duplicated = await transactionService.duplicate(user.userId, id);
    return apiSuccess(normalizeTransaction(duplicated), 201);
  } catch (err) {
    if (err instanceof TransactionError) return apiError(err.message, err.status);
    return apiError('Could not duplicate transaction.', 500);
  }
});
