import { connectDB } from '@/lib/db';
import Settings from '@/models/Settings';

export const settingsRepository = {
  async findByUser(userId: string) {
    await connectDB();
    let settings = await Settings.findOne({ userId });
    if (!settings) settings = await Settings.create({ userId });
    return settings;
  },

  async updateByUser(userId: string, data: Record<string, unknown>) {
    await connectDB();
    return Settings.findOneAndUpdate({ userId }, data, {
      new: true,
      upsert: true,
      runValidators: true,
    });
  },
};
