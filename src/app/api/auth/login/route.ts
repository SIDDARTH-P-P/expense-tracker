import { NextRequest } from 'next/server';
import { authService, AuthError } from '@/services/auth.service';
import { loginSchema } from '@/lib/validations/auth.schema';
import { setAuthCookies } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);
    }

    const { email, password, rememberMe } = parsed.data;
    const user = await authService.login(email, password);
    await setAuthCookies(
      { userId: String(user._id), email: user.email, role: user.role ?? 'user' },
      rememberMe
    );

    return apiSuccess({
      id: String(user._id),
      name: user.name,
      email: user.email,
      currency: user.currency,
      theme: user.theme,
      role: user.role ?? 'user',
    });
  } catch (err) {
    if (err instanceof AuthError) return apiError(err.message, err.status);
    console.error('Login error:', err);
    return apiError('Something went wrong while logging in.', 500);
  }
}
