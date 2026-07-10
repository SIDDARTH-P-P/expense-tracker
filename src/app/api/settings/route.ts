import { withAuth } from '@/middlewares/with-auth';
import { settingsService } from '@/services/settings.service';
import { userRepository } from '@/repositories/user.repository';
import { apiSuccess } from '@/lib/utils/api-response';

export const GET = withAuth(async (_req, user) => {
  const settings = await settingsService.get(user.userId);
  return apiSuccess(settings);
});

export const PATCH = withAuth(async (req, user) => {
  const body = await req.json();
  const updated = await settingsService.update(user.userId, body);

  // Sync profile settings in User collection
  const userUpdates: Record<string, any> = {};
  if (body.theme) userUpdates.theme = body.theme;
  if (body.currency) userUpdates.currency = body.currency;
  if (body.language) userUpdates.language = body.language;

  if (Object.keys(userUpdates).length > 0) {
    await userRepository.updateById(user.userId, userUpdates);
  }

  return apiSuccess(updated);
});
