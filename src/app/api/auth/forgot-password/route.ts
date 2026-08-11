import { NextRequest } from 'next/server';
import { userRepository } from '@/repositories/user.repository';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { sendResetPasswordEmail } from '@/lib/services/mailer.service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return apiError('Email is required.', 422);

    const user = await userRepository.findByEmail(email);
    if (user) {
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '10m' }
      );

      const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

      await sendResetPasswordEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });

      console.log(`[forgot-password] Reset link emailed to ${email}`);
    }

    return apiSuccess({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return apiError('Something went wrong.', 500);
  }
}

