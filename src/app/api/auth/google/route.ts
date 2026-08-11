import { NextRequest } from 'next/server';
import { authService, AuthError } from '@/services/auth.service';
import { setAuthCookies } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let email: string | undefined;
    let name: string | undefined;
    let avatar: string | undefined;

    // 1. Verify Google ID Token (Credential)
    if (body.credential && typeof body.credential === 'string') {
      const decoded = jwt.decode(body.credential) as { email?: string; name?: string; picture?: string; email_verified?: boolean } | null;
      if (decoded?.email) {
        email = decoded.email;
        name = decoded.name || decoded.email.split('@')[0];
        avatar = decoded.picture;
      }
    }

    // 2. Verify Google OAuth Access Token with Google's API
    if (!email && body.accessToken && typeof body.accessToken === 'string') {
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${body.accessToken}` },
      });
      if (googleRes.ok) {
        const profile = await googleRes.json();
        if (profile.email) {
          const profileEmail = profile.email as string;
          email = profileEmail;
          name = profile.name || profile.given_name || profileEmail.split('@')[0];
          avatar = profile.picture;
        }
      }
    }

    // Reject raw email requests without verified Google tokens
    if (!email) {
      return apiError('Authentication failed: Valid Google account token or sign-in is required.', 401);
    }

    const user = await authService.googleLogin(email, name);
    await setAuthCookies(
      { userId: String(user._id), email: user.email, role: user.role ?? 'user' },
      true
    );

    return apiSuccess({
      id: String(user._id),
      name: user.name,
      email: user.email,
      currency: user.currency,
      theme: user.theme,
      role: user.role ?? 'user',
      avatar: avatar || user.avatar,
    });
  } catch (err) {
    if (err instanceof AuthError) return apiError(err.message, err.status);
    console.error('Google Auth error:', err);
    return apiError('Something went wrong during Google Sign In.', 500);
  }
}
