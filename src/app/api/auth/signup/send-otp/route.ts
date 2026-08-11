import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Otp from '@/models/Otp';
import { userRepository } from '@/repositories/user.repository';
import { signupSchema } from '@/lib/validations/auth.schema';
import { hashPassword } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/services/mailer.service';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);
    }

    const { name, email, password } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(cleanEmail);
    if (existingUser) {
      return apiError('An account with this email already exists. Please log in.', 400);
    }

    // Generate 6-digit random numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await hashPassword(password);

    // Remove any existing OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Store fresh OTP record
    await Otp.create({
      email: cleanEmail,
      otp: otpCode,
      name: name.trim(),
      passwordHash,
    });

    // Send OTP email
    await sendOtpEmail({
      to: cleanEmail,
      name: name.trim(),
      otp: otpCode,
    });

    console.log(`[send-otp] Verification code ${otpCode} sent to ${cleanEmail}`);

    return apiSuccess({ message: 'Verification code sent to your email.' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Send OTP error:', errorMsg);
    return apiError(`Failed to send verification email: ${errorMsg}`, 500);
  }
}
