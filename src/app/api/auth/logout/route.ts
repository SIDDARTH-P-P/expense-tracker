import { NextRequest } from 'next/server';
import { clearAuthCookies, clearSessionCookie, getSessionId } from '@/lib/auth';
import { apiSuccess } from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';

export async function POST(req: NextRequest) {
  // Remove the session record from DB
  try {
    const sessionId = await getSessionId(req);
    if (sessionId) {
      await connectDB();
      await Session.deleteOne({ sessionId });
    }
  } catch {
    // Don't fail the logout if session cleanup errors
  }

  await clearAuthCookies();
  await clearSessionCookie();
  return apiSuccess({ loggedOut: true });
}
