import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/user.repository';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return apiError('Token and new password are required.', 422);
    }

    if (password.length < 6) {
      return apiError('Password must be at least 6 characters long.', 422);
    }

    // Verify token & check expiration (10 min lifetime)
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        return apiError('Password reset token has expired (valid for 10 minutes). Please request a new one.', 400);
      }
      return apiError('Invalid or corrupted password reset token.', 400);
    }

    const email = decoded.email || decoded.userId;
    if (!email) {
      return apiError('Invalid token payload.', 400);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return apiError('User account not found.', 444);
    }

    // Hash password & update user
    const passwordHash = await bcrypt.hash(password, 12);
    await userRepository.updateById(user._id ? user._id.toString() : user.id, { password: passwordHash });

    console.log(`[reset-password] Password updated successfully for ${email}`);
    return apiSuccess({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return apiError('Something went wrong. Please try again.', 500);
  }
}
