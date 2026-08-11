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

    const cleanEmail = email.trim().toLowerCase();

    // Dynamically resolve base URL (support Vercel deployments, custom domains, and local dev)
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const reqOrigin = host ? `${proto}://${host}` : req.nextUrl.origin;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : reqOrigin);

    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      return apiError('No account found with this email address.', 404);
    }

    const userName = user.name || cleanEmail.split('@')[0] || 'User';
    const userId = user.id || user._id?.toString() || cleanEmail;

    const resetToken = jwt.sign(
      { userId, email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

    // Send password reset email via Nodemailer
    await sendResetPasswordEmail({
      to: cleanEmail,
      name: userName,
      resetUrl,
    });

    console.log(`[forgot-password] Reset password link successfully sent to ${cleanEmail} (URL: ${resetUrl})`);

    return apiSuccess({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err);
    console.error('[forgot-password] Failed to send reset email:', errorDetails);
    return apiError(`Failed to send email: ${errorDetails}`, 500);
  }
}

