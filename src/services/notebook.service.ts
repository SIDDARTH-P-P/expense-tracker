import { Types } from 'mongoose';
import Notebook, { INotebook } from '@/models/Notebook';
import { generateRecordId } from '@/lib/generateRecordId';

export class NotebookError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function getMonthYearBookName(dateInput?: Date | string): { name: string; month: number; year: number } {
  const d = dateInput ? new Date(dateInput) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const month = validDate.getMonth();
  const year = validDate.getFullYear();
  const monthName = validDate.toLocaleString('en-US', { month: 'long' });
  return {
    name: `${monthName} ${year}`,
    month,
    year,
  };
}

export const notebookService = {
  async getActiveMonthStatus(userId: string, dateInput?: Date | string) {
    const { name, month, year } = getMonthYearBookName(dateInput);
    const existing = await Notebook.findOne({
      userId: new Types.ObjectId(userId),
      month,
      year,
      isAutoMonthly: true,
    });

    return {
      exists: !!existing,
      name,
      month,
      year,
      notebook: existing,
    };
  },

  async ensureCurrentMonthNotebook(userId: string, dateInput?: Date | string) {
    const { name, month, year } = getMonthYearBookName(dateInput);
    const userObjId = new Types.ObjectId(userId);

    let existing = await Notebook.findOne({
      userId: userObjId,
      $or: [
        { month, year, isAutoMonthly: true },
        { name },
      ],
    });

    if (!existing) {
      try {
        existing = await Notebook.create({
          recordId: await generateRecordId('NBK'),
          userId: userObjId,
          name,
          month,
          year,
          isAutoMonthly: true,
          color: '#6366F1',
          icon: 'FiBook',
        });
      } catch (err: any) {
        if (err?.code === 11000) {
          existing = await Notebook.findOne({ userId: userObjId, name });
        } else {
          throw err;
        }
      }
    }

    return existing;
  },

  async list(userId: string) {
    return Notebook.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  },

  async create(userId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new NotebookError('Book name is required.', 400);
    }

    const userObjId = new Types.ObjectId(userId);
    const existing = await Notebook.findOne({ userId: userObjId, name: trimmed });
    if (existing) {
      return existing;
    }

    return Notebook.create({
      recordId: await generateRecordId('NBK'),
      userId: userObjId,
      name: trimmed,
      isAutoMonthly: false,
      color: '#06B6D4',
      icon: 'FiBookOpen',
    });
  },
};
