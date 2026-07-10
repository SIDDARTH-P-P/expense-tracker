import { connectDB } from '@/lib/db';
import Category, { type ICategory } from '@/models/Category';
import mongoose, { type FilterQuery } from 'mongoose';

function identifierFilter(id: string, userId: string): FilterQuery<ICategory> {
  const candidates: FilterQuery<ICategory>[] = [{ recordId: id }];
  if (mongoose.isValidObjectId(id)) candidates.push({ _id: id });
  return { userId, $or: candidates };
}

export const categoryRepository = {
  async findAllForUser(userId: string, search?: string) {
    await connectDB();
    const filter: FilterQuery<ICategory> = { userId };
    if (search?.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { recordId: { $regex: q, $options: 'i' } },
        { type: { $regex: q, $options: 'i' } },
      ];
    }
    return Category.find(filter).sort({ isDefault: -1, type: 1, name: 1 });
  },

  async findById(id: string, userId: string) {
    await connectDB();
    return Category.findOne(identifierFilter(id, userId));
  },

  async findByName(userId: string, name: string) {
    await connectDB();
    return Category.findOne({ userId, name });
  },

  async findMissingRecordIds(userId: string) {
    await connectDB();
    return Category.find({ userId, recordId: { $exists: false } }).select('_id type');
  },

  async createMany(categories: Partial<ICategory>[]) {
    await connectDB();
    return Category.insertMany(categories, { ordered: false });
  },

  async create(data: Partial<ICategory>) {
    await connectDB();
    return Category.create(data);
  },

  async updateById(id: string, userId: string, data: Partial<ICategory>) {
    await connectDB();
    return Category.findOneAndUpdate(identifierFilter(id, userId), data, { new: true, runValidators: true });
  },

  async setRecordId(id: string, recordId: string) {
    await connectDB();
    return Category.updateOne({ _id: id, recordId: { $exists: false } }, { $set: { recordId } });
  },

  async deleteById(id: string, userId: string) {
    await connectDB();
    return Category.findOneAndDelete({ ...identifierFilter(id, userId), isDefault: false });
  },
};
