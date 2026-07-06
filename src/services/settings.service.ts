import { settingsRepository } from '@/repositories/settings.repository';

export const settingsService = {
  async get(userId: string) {
    return settingsRepository.findByUser(userId);
  },
  async update(userId: string, data: Record<string, unknown>) {
    return settingsRepository.updateByUser(userId, data);
  },
};
