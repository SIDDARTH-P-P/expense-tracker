import { userRepository } from '@/repositories/user.repository';
import { profileRepository } from '@/repositories/profile.repository';
import { categoryService } from '@/services/category.service';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { generateUniqueUsername, generateUniqueMemberId } from '@/lib/utils/generate-user-fields';

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
    const username = await generateUniqueUsername(name, email);
    const memberId = await generateUniqueMemberId();

    const user = await userRepository.create({ name, email, password: hashed, username, memberId } as any);

    // Create corresponding profile document in Profile collection
    await profileRepository.createProfile(String(user._id), name, email, { username, memberId });

    await categoryService.ensureDefaultCategories(user._id);

    return user;
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) throw new AuthError('Invalid email or password.', 401);

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw new AuthError('Invalid email or password.', 401);

    // Ensure Profile collection document exists for existing user
    await profileRepository.getOrCreateProfile(String(user._id));

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

  async googleLogin(email: string, name?: string) {
    let user = await userRepository.findByEmail(email);
    if (!user) {
      const randomPassword = await hashPassword(Math.random().toString(36).substring(2) + Date.now().toString());
      const displayName = name || email.split('@')[0];
      const username = await generateUniqueUsername(displayName, email);
      const memberId = await generateUniqueMemberId();

      user = await userRepository.create({
        name: displayName,
        email,
        password: randomPassword,
        username,
        memberId,
      } as any);

      // Create profile document in Profile collection
      await profileRepository.createProfile(String(user._id), displayName, email, { username, memberId });

      await categoryService.ensureDefaultCategories(user._id);
    } else {
      // Ensure Profile collection document exists
      await profileRepository.getOrCreateProfile(String(user._id));
    }
    return user;
  },
};
