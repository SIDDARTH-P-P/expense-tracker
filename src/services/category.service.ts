import { Types } from 'mongoose';
import { categoryRepository } from '@/repositories/category.repository';
import type { CategoryFormValues } from '@/lib/validations/category.schema';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { generateRecordId } from '@/lib/generateRecordId';

export class CategoryError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function isDuplicateKeyError(err: unknown) {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}

export const categoryService = {
  async ensureDefaultCategories(userId: string | Types.ObjectId) {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const userIdString = String(userObjectId);

    const existing = await categoryRepository.findAllForUser(userIdString);
    const existingNames = new Set(existing.map((category) => category.name.toLowerCase()));
    const missingDefaults = DEFAULT_CATEGORIES.filter((category) => !existingNames.has(category.name.toLowerCase()));

    if (missingDefaults.length === 0) return;

    const categories = await Promise.all(
      missingDefaults.map(async (category) => ({
        ...category,
        userId: userObjectId,
        isDefault: true,
        recordId: await generateRecordId('CAT'),
      }))
    );

    try {
      await categoryRepository.createMany(categories);
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }
  },

  async ensureRecordIds(userId: string) {
    const missing = await categoryRepository.findMissingRecordIds(userId);
    await Promise.all(
      missing.map(async (category) =>
        categoryRepository.setRecordId(String(category._id), await generateRecordId('CAT'))
      )
    );
  },

  async list(userId: string, search?: string) {
    await this.ensureDefaultCategories(userId);
    await this.ensureRecordIds(userId);
    return categoryRepository.findAllForUser(userId, search);
  },

  async get(userId: string, id: string) {
    await this.ensureRecordIds(userId);
    const category = await categoryRepository.findById(id, userId);
    if (!category) throw new CategoryError('Category not found.', 404);
    return category;
  },

  async create(userId: string, data: CategoryFormValues) {
    try {
      return await categoryRepository.create({
        ...data,
        recordId: await generateRecordId('CAT'),
        userId: new Types.ObjectId(userId),
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new CategoryError('A category with this name already exists.', 409);
      throw err;
    }
  },

  async update(userId: string, id: string, data: Partial<CategoryFormValues>) {
    try {
      const updated = await categoryRepository.updateById(id, userId, data as Record<string, any>);
      if (!updated) throw new CategoryError('Category not found.', 404);
      return updated;
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new CategoryError('A category with this name already exists.', 409);
      throw err;
    }
  },

  async remove(userId: string, id: string) {
    const deleted = await categoryRepository.deleteById(id, userId);
    if (!deleted) throw new CategoryError('Category not found or is a protected default category.', 404);
    return deleted;
  },
};
