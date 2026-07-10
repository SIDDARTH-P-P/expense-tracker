import { connectDB } from '@/lib/db';
import Split, { type ISplit } from '@/models/Split';
import SplitUser from '@/models/SplitUser';
import mongoose, { type FilterQuery } from 'mongoose';

function identifierFilter(id: string, userId: string): FilterQuery<ISplit> {
  const candidates: FilterQuery<ISplit>[] = [{ recordId: id }];
  if (mongoose.isValidObjectId(id)) candidates.push({ _id: id });
  return { userId, $or: candidates };
}

export const splitRepository = {
  async findAllForUser(userId: string, search?: string) {
    await connectDB();
    const filter: FilterQuery<ISplit> = { userId };
    if (search?.trim()) {
      const q = search.trim();
      const splitUsers = await SplitUser.find({
        userId,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { recordId: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');

      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { recordId: { $regex: q, $options: 'i' } },
        ...(splitUsers.length
          ? [
              { paidBy: { $in: splitUsers.map((splitUser) => splitUser._id) } },
              { 'members.userId': { $in: splitUsers.map((splitUser) => splitUser._id) } },
            ]
          : []),
      ];
    }

    return Split.find(filter)
      .populate('paidBy')
      .populate('members.userId')
      .sort({ createdAt: -1 });
  },

  async findById(id: string, userId: string) {
    await connectDB();
    return Split.findOne(identifierFilter(id, userId)).populate('paidBy').populate('members.userId');
  },

  async create(data: Partial<ISplit>) {
    await connectDB();
    return Split.create(data).then((doc) => doc.populate(['paidBy', 'members.userId']));
  },

  async updateById(id: string, userId: string, data: Partial<ISplit>) {
    await connectDB();
    return Split.findOneAndUpdate(identifierFilter(id, userId), data, { new: true, runValidators: true })
      .populate('paidBy')
      .populate('members.userId');
  },

  async deleteById(id: string, userId: string) {
    await connectDB();
    return Split.findOneAndDelete(identifierFilter(id, userId));
  },
};
