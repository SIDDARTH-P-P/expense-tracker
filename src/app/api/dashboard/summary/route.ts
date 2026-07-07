import { withAuth } from '@/middlewares/with-auth';
import { dashboardService } from '@/services/dashboard.service';
import { apiSuccess } from '@/lib/utils/api-response';
import { normalizeCategory, normalizeTransaction } from '@/lib/utils/normalize-transaction';

export const GET = withAuth(async (_req, user) => {
  const summary = await dashboardService.getSummary(user.userId);
  return apiSuccess({
    ...summary,
    recentTransactions: summary.recentTransactions.map(normalizeTransaction),
    topCategories: summary.topCategories.map((item) => ({
      ...item,
      category: normalizeCategory(item.category),
    })),
  });
});
