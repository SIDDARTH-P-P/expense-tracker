import { NextRequest } from 'next/server';
import { withAuth } from '@/middlewares/with-auth';
import { auditService } from '@/services/audit.service';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get('page') ?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 20);
    const category = searchParams.get('category') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const logsData = await auditService.getUserLogs(user.userId, {
      page,
      pageSize,
      category,
      search,
    });

    // If total logs count is zero for a newly logged-in user, create an initial login audit entry so the log is never completely empty
    if (logsData.pagination.total === 0 && page === 1 && !category && !search) {
      await auditService.logLogin(user.userId, req);
      const rechecked = await auditService.getUserLogs(user.userId, {
        page,
        pageSize,
        category,
        search,
      });
      return apiSuccess(rechecked);
    }

    return apiSuccess(logsData);
  } catch (err) {
    console.error('Get activity logs error:', err);
    return apiError('Could not fetch activity logs.', 500);
  }
});
