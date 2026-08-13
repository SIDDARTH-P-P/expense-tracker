import Profile, { IProfile } from '@/models/Profile';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { generateUniqueUsername, generateUniqueMemberId } from '@/lib/utils/generate-user-fields';

export const profileRepository = {
  async findByUserId(userId: string): Promise<IProfile | null> {
    await connectDB();
    return Profile.findOne({ userId });
  },

  async createProfile(
    userId: string,
    name: string,
    email: string,
    additionalData?: Partial<IProfile>
  ): Promise<IProfile> {
    await connectDB();
    const username = additionalData?.username || (await generateUniqueUsername(name, email));
    const memberId = additionalData?.memberId || (await generateUniqueMemberId());

    const profile = await Profile.create({
      userId,
      name,
      email,
      username,
      memberId,
      avatar: additionalData?.avatar || '',
      phone: additionalData?.phone || '',
      address: additionalData?.address || '',
      language: additionalData?.language || 'en',
    });

    return profile;
  },

  async getOrCreateProfile(userId: string): Promise<IProfile> {
    await connectDB();
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const username = user.username || (await generateUniqueUsername(user.name, user.email));
      const memberId = user.memberId || (await generateUniqueMemberId());

      profile = await Profile.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        username,
        memberId,
        avatar: user.avatar || '',
        phone: user.phone || '',
        address: user.address || '',
        language: user.language || 'en',
      });

      // Also ensure user model has these synced
      if (!user.username || !user.memberId) {
        user.username = username;
        user.memberId = memberId;
        await user.save();
      }
    }

    return profile;
  },

  async updateByUserId(userId: string, updateData: Partial<IProfile>): Promise<IProfile | null> {
    await connectDB();

    // Check if username is being changed and verify uniqueness
    if (updateData.username) {
      const existingWithUsername = await Profile.findOne({
        username: updateData.username.toLowerCase(),
        userId: { $ne: userId },
      });
      if (existingWithUsername) {
        throw new Error('Username is already taken by another account');
      }
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Also update User document if name/email/avatar were modified
    const userUpdates: Record<string, any> = {};
    if (updateData.name) userUpdates.name = updateData.name;
    if (updateData.email) userUpdates.email = updateData.email;
    if (updateData.avatar !== undefined) userUpdates.avatar = updateData.avatar;
    if (updateData.username) userUpdates.username = updateData.username;
    if (updateData.phone !== undefined) userUpdates.phone = updateData.phone;
    if (updateData.address !== undefined) userUpdates.address = updateData.address;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userUpdates });
    }

    return updatedProfile;
  },
};
