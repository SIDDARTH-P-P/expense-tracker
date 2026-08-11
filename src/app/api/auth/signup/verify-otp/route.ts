import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Otp from '@/models/Otp';
import { userRepository } from '@/repositories/user.repository';
import { setAuthCookies } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return apiError('Email and verification code are required.', 422);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Find valid OTP record
    const otpRecord = await Otp.findOne({ email: cleanEmail, otp: cleanOtp });
    if (!otpRecord) {
      return apiError('Invalid or expired verification code. Please check your email or request a new code.', 400);
    }

    // Double check user doesn't already exist
    let user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      user = await userRepository.create({
        name: otpRecord.name,
        email: cleanEmail,
        password: otpRecord.passwordHash,
      });
    }

    // Delete used OTP
    await Otp.deleteMany({ email: cleanEmail });

    // Set auth session cookies
    await setAuthCookies({
      userId: String(user._id),
      email: user.email,
      role: user.role ?? 'user',
    });

    console.log(`[verify-otp] Account created & verified for ${cleanEmail}`);

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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Verify OTP error:', errorMsg);
    return apiError('Verification failed. Please try again.', 500);
  }
}
