import { connectDB } from '@/lib/db';
import Category, { type ICategory } from '@/models/Category';

export const categoryRepository = {
  async findAllForUser(userId: string) {
    await connectDB();
    return Category.find({ userId }).sort({ isDefault: -1, name: 1 });
  },

  async findById(id: string, userId: string) {
    await connectDB();
    return Category.findOne({ _id: id, userId });
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
    return Category.findOneAndUpdate({ _id: id, userId }, data, { new: true, runValidators: true });
  },

  async deleteById(id: string, userId: string) {
    await connectDB();
    return Category.findOneAndDelete({ _id: id, userId, isDefault: false });
  },
};
