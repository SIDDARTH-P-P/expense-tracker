import { NextRequest } from 'next/server';
import { userRepository } from '@/repositories/user.repository';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

/**
 * NOTE: This is a scaffold. Wire up a transactional email provider
 * (Resend, SendGrid, SES) to actually deliver the reset link. To avoid
 * leaking which emails are registered, we always return a generic success
 * response regardless of whether the account exists.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return apiError('Email is required.', 422);

    const user = await userRepository.findByEmail(email);
    if (user) {
      // TODO: generate a signed reset token and email it via your provider.
      console.log(`[forgot-password] Reset requested for ${email}`);
    }

    return apiSuccess({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return apiError('Something went wrong.', 500);
  }
}
