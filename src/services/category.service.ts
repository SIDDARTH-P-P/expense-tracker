import { Types } from 'mongoose';
import { categoryRepository } from '@/repositories/category.repository';
import type { CategoryFormValues } from '@/lib/validations/category.schema';

export class CategoryError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const categoryService = {
  async list(userId: string) {
    return categoryRepository.findAllForUser(userId);
  },

  async create(userId: string, data: CategoryFormValues) {
    return categoryRepository.create({ ...data, userId: new Types.ObjectId(userId) });
  },

  async update(userId: string, id: string, data: Partial<CategoryFormValues>) {
    const updated = await categoryRepository.updateById(id, userId, data);
    if (!updated) throw new CategoryError('Category not found.', 404);
    return updated;
  },

  async remove(userId: string, id: string) {
    const deleted = await categoryRepository.deleteById(id, userId);
    if (!deleted) throw new CategoryError('Category not found or is a protected default category.', 404);
    return deleted;
  },
};
