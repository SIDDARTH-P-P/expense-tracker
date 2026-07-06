import { clearAuthCookies } from '@/lib/auth';
import { apiSuccess } from '@/lib/utils/api-response';

export async function POST() {
  await clearAuthCookies();
  return apiSuccess({ loggedOut: true });
}
