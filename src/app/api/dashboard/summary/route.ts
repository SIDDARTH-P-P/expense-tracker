import { withAuth } from '@/middlewares/with-auth';
import { dashboardService } from '@/services/dashboard.service';
import { apiSuccess } from '@/lib/utils/api-response';

export const GET = withAuth(async (_req, user) => {
  const summary = await dashboardService.getSummary(user.userId);
  return apiSuccess(summary);
});
