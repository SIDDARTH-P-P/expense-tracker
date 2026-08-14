import { withAuth } from '@/middlewares/with-auth';
import { transactionService, TransactionError } from '@/services/transaction.service';
import { transactionSchema } from '@/lib/validations/transaction.schema';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { normalizeTransaction } from '@/lib/utils/normalize-transaction';
import { auditService, type AuditChangeItem } from '@/services/audit.service';

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

    let existingTx: any = null;
    try {
      existingTx = await transactionService.get(user.userId, id);
    } catch {
      // Ignored
    }

    const updated = await transactionService.update(user.userId, id, parsed.data);

    try {
      const changes: AuditChangeItem[] = [];

      if (existingTx) {
        const fieldsToCheck = ['title', 'amount', 'type', 'category', 'date', 'notebook'];
        const labels: Record<string, string> = {
          title: 'Title',
          amount: 'Amount',
          type: 'Type',
          category: 'Category',
          date: 'Date',
          notebook: 'Collection',
        };

        for (const f of fieldsToCheck) {
          if (parsed.data[f as keyof typeof parsed.data] !== undefined && parsed.data[f as keyof typeof parsed.data] !== existingTx[f]) {
            changes.push({
              field: f,
              label: labels[f] || f,
              oldValue: existingTx[f] ?? 'None',
              newValue: parsed.data[f as keyof typeof parsed.data] ?? 'None',
            });
          }
        }
      }

      await auditService.logTransaction(user.userId, 'TRANSACTION_UPDATE', updated, changes, req);
    } catch {
      // Best effort
    }

    return apiSuccess(normalizeTransaction(updated));
  } catch (err) {
    if (err instanceof TransactionError) return apiError(err.message, err.status);
    return apiError('Could not update transaction.', 500);
  }
});

export const PUT = PATCH;

export const DELETE = withAuth(async (req, user, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    let existingTx: any = null;
    try {
      existingTx = await transactionService.get(user.userId, id);
    } catch {
      // Ignored
    }

    await transactionService.remove(user.userId, id);

    if (existingTx) {
      try {
        const { auditService } = await import('@/services/audit.service');
        await auditService.logTransaction(user.userId, 'TRANSACTION_DELETE', existingTx, [], req);
      } catch {
        // Best effort
      }
    }

    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof TransactionError) return apiError(err.message, err.status);
    return apiError('Could not delete transaction.', 500);
  }
});
