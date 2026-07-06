import { NextRequest } from 'next/server';
import { withAuth } from '@/middlewares/with-auth';
import { transactionService, TransactionError } from '@/services/transaction.service';
import { transactionSchema } from '@/lib/validations/transaction.schema';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const result = await transactionService.list(user.userId, {
    search: searchParams.get('search') ?? undefined,
    type: (searchParams.get('type') as 'income' | 'expense') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    sortBy: (searchParams.get('sortBy') as 'date' | 'amount') ?? 'date',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
    page: Number(searchParams.get('page') ?? 1),
    pageSize: Number(searchParams.get('pageSize') ?? 20),
  });
  return apiSuccess(result);
});

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);

    const created = await transactionService.create(user.userId, parsed.data);
    return apiSuccess(created, 201);
  } catch (err) {
    if (err instanceof TransactionError) return apiError(err.message, err.status);
    console.error('Create transaction error:', err);
    return apiError('Could not create transaction.', 500);
  }
});
