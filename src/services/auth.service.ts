import { userRepository } from '@/repositories/user.repository';
import { categoryService } from '@/services/category.service';
import { hashPassword, verifyPassword } from '@/lib/auth';

export class AuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const authService = {
  async signup(name: string, email: string, password: string) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AuthError('An account with this email already exists.', 409);

    const hashed = await hashPassword(password);
    const user = await userRepository.create({ name, email, password: hashed });

    await categoryService.ensureDefaultCategories(user._id);

    return user;
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) throw new AuthError('Invalid email or password.', 401);

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw new AuthError('Invalid email or password.', 401);

    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findByEmail((await userRepository.findById(userId))!.email, true);
    if (!user) throw new AuthError('User not found.', 404);

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) throw new AuthError('Current password is incorrect.', 401);

    user.password = await hashPassword(newPassword);
    await user.save();
    return user;
  },
};
