import { NextRequest } from 'next/server';
import { authService, AuthError } from '@/services/auth.service';
import { signupSchema } from '@/lib/validations/auth.schema';
import { setAuthCookies } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);
    }

    const { name, email, password } = parsed.data;
    const user = await authService.signup(name, email, password);
    await setAuthCookies({ userId: String(user._id), email: user.email, role: user.role ?? 'user' });

    return apiSuccess(
      {
        id: String(user._id),
        name: user.name,
        email: user.email,
        currency: user.currency,
        theme: user.theme,
        role: user.role ?? 'user',
      },
      201
    );
  } catch (err) {
    if (err instanceof AuthError) return apiError(err.message, err.status);
    console.error('Signup error:', err);
    return apiError('Something went wrong while creating your account.', 500);
  }
}
