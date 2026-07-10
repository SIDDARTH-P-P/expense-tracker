import { Types } from 'mongoose';
import { generateRecordId } from '@/lib/generateRecordId';
import { splitUserRepository } from '@/repositories/split-user.repository';
import type { SplitUserFormValues } from '@/lib/validations/split-user.schema';

export class SplitUserError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function isDuplicateKeyError(err: unknown) {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}

export const splitUserService = {
  async list(userId: string, search?: string) {
    return splitUserRepository.findAllForUser(userId, search);
  },

  async get(userId: string, id: string) {
    const splitUser = await splitUserRepository.findById(id, userId);
    if (!splitUser) throw new SplitUserError('Split user not found.', 404);
    return splitUser;
  },

  async create(userId: string, input: SplitUserFormValues) {
    try {
      return await splitUserRepository.create({
        ...input,
        recordId: await generateRecordId('USR'),
        userId: new Types.ObjectId(userId),
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new SplitUserError('This email is already used for a split user.', 409);
      throw err;
    }
  },

  async update(userId: string, id: string, input: Partial<SplitUserFormValues>) {
    try {
      const updated = await splitUserRepository.updateById(id, userId, input);
      if (!updated) throw new SplitUserError('Split user not found.', 404);
      return updated;
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new SplitUserError('This email is already used for a split user.', 409);
      throw err;
    }
  },

  async remove(userId: string, id: string) {
    const deleted = await splitUserRepository.deleteById(id, userId);
    if (!deleted) throw new SplitUserError('Split user not found.', 404);
    return deleted;
  },
};
