import { withAuth } from '@/middlewares/with-auth';
import { settingsService } from '@/services/settings.service';
import { apiSuccess } from '@/lib/utils/api-response';

export const GET = withAuth(async (_req, user) => {
  const settings = await settingsService.get(user.userId);
  return apiSuccess(settings);
});

export const PATCH = withAuth(async (req, user) => {
  const body = await req.json();
  const updated = await settingsService.update(user.userId, body);
  return apiSuccess(updated);
});
