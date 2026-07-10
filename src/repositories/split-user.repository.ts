import { connectDB } from '@/lib/db';
import SplitUser, { type ISplitUser } from '@/models/SplitUser';
import mongoose, { type FilterQuery } from 'mongoose';

function identifierFilter(id: string, userId: string): FilterQuery<ISplitUser> {
  const candidates: FilterQuery<ISplitUser>[] = [{ recordId: id }];
  if (mongoose.isValidObjectId(id)) candidates.push({ _id: id });
  return { userId, $or: candidates };
}

export const splitUserRepository = {
  async findAllForUser(userId: string, search?: string) {
    await connectDB();
    const filter: FilterQuery<ISplitUser> = { userId };
    if (search?.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { recordId: { $regex: q, $options: 'i' } },
      ];
    }
    return SplitUser.find(filter).sort({ name: 1 });
  },

  async findById(id: string, userId: string) {
    await connectDB();
    return SplitUser.findOne(identifierFilter(id, userId));
  },

  async findByIds(ids: string[], userId: string) {
    await connectDB();
    return SplitUser.find({ _id: { $in: ids }, userId });
  },

  async create(data: Partial<ISplitUser>) {
    await connectDB();
    return SplitUser.create(data);
  },

  async updateById(id: string, userId: string, data: Partial<ISplitUser>) {
    await connectDB();
    return SplitUser.findOneAndUpdate(identifierFilter(id, userId), data, { new: true, runValidators: true });
  },

  async deleteById(id: string, userId: string) {
    await connectDB();
    return SplitUser.findOneAndDelete(identifierFilter(id, userId));
  },
};
