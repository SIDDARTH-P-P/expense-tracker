import { withAuth } from '@/middlewares/with-auth';
import { notebookService, NotebookError } from '@/services/notebook.service';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export const GET = withAuth(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') ?? undefined;

    const [notebooks, activeMonthStatus] = await Promise.all([
      notebookService.list(user.userId),
      notebookService.getActiveMonthStatus(user.userId, dateParam),
    ]);

    return apiSuccess({
      notebooks: notebooks.map((nb) => ({
        id: nb._id.toString(),
        recordId: nb.recordId,
        userId: nb.userId.toString(),
        name: nb.name,
        month: nb.month,
        year: nb.year,
        isAutoMonthly: nb.isAutoMonthly,
        color: nb.color,
        icon: nb.icon,
        createdAt: nb.createdAt,
        updatedAt: nb.updatedAt,
      })),
      activeMonthStatus,
    });
  } catch (err) {
    console.error('List notebooks error:', err);
    return apiError('Could not fetch transaction books.', 500);
  }
});

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json();

    if (body.action === 'ensure_current') {
      const notebook = await notebookService.ensureCurrentMonthNotebook(user.userId, body.date);
      return apiSuccess({
        id: notebook._id.toString(),
        recordId: notebook.recordId,
        userId: notebook.userId.toString(),
        name: notebook.name,
        month: notebook.month,
        year: notebook.year,
        isAutoMonthly: notebook.isAutoMonthly,
        color: notebook.color,
        icon: notebook.icon,
      }, 201);
    }

    const name = body.name;
    if (!name || typeof name !== 'string') {
      return apiError('Book name is required.', 422);
    }

    const created = await notebookService.create(user.userId, name);
    return apiSuccess({
      id: created._id.toString(),
      recordId: created.recordId,
      userId: created.userId.toString(),
      name: created.name,
      month: created.month,
      year: created.year,
      isAutoMonthly: created.isAutoMonthly,
      color: created.color,
      icon: created.icon,
    }, 201);
  } catch (err) {
    if (err instanceof NotebookError) return apiError(err.message, err.status);
    console.error('Create notebook error:', err);
    return apiError('Could not create transaction book.', 500);
  }
});
