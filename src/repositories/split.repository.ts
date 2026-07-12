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

    // Find splits involving the user (created by them, paid by them, or where they are a member)
    const user = await mongoose.model('User').findById(userId);
    const userEmail = user?.email?.toLowerCase() || '';
    const matchingSplitUsers = await mongoose.model('SplitUser').find({
      email: userEmail
    }).select('_id');
    const matchingSplitUserIds = matchingSplitUsers.map((su: any) => su._id);

    const baseFilter: FilterQuery<ISplit> = {
      $or: [
        { userId: new mongoose.Types.ObjectId(userId) },
        { paidBy: { $in: matchingSplitUserIds } },
        { 'members.userId': { $in: matchingSplitUserIds } }
      ]
    };

    let filter = { ...baseFilter };

    if (search?.trim()) {
      const q = search.trim();
      
      // 1. Search transactions by record ID to find linked split IDs
      const txs = await mongoose.model('Transaction').find({
        recordId: { $regex: q, $options: 'i' },
        splitId: { $ne: null }
      }).select('splitId');
      const transactionSplitIds = txs.map((tx: any) => tx.splitId);

      // 2. Search SplitUsers by name, email, recordId
      const splitUsers = await mongoose.model('SplitUser').find({
        userId,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { recordId: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');

      // 3. Search Creator (User)
      const creatorMatch = await mongoose.model('User').findOne({
        _id: userId,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      });

      const searchFilter = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { recordId: { $regex: q, $options: 'i' } },
          { _id: { $in: transactionSplitIds } },
          ...(creatorMatch ? [{ userId: creatorMatch._id }] : []),
          ...(splitUsers.length
            ? [
                { paidBy: { $in: splitUsers.map((su: any) => su._id) } },
                { 'members.userId': { $in: splitUsers.map((su: any) => su._id) } },
              ]
            : []),
        ]
      };

      filter = {
        $and: [baseFilter, searchFilter]
      } as any;
    }

    return Split.find(filter)
      .populate('paidBy')
      .populate('members.userId')
      .sort({ createdAt: -1 });
  },

  async findById(id: string, userId: string) {
    await connectDB();
    const user = await mongoose.model('User').findById(userId);
    const userEmail = user?.email?.toLowerCase() || '';
    const matchingSplitUsers = await mongoose.model('SplitUser').find({
      email: userEmail
    }).select('_id');
    const matchingSplitUserIds = matchingSplitUsers.map((su: any) => su._id);

    const candidates: FilterQuery<ISplit>[] = [{ recordId: id }];
    if (mongoose.isValidObjectId(id)) candidates.push({ _id: id });

    return Split.findOne({
      $and: [
        {
          $or: [
            { userId: new mongoose.Types.ObjectId(userId) },
            { paidBy: { $in: matchingSplitUserIds } },
            { 'members.userId': { $in: matchingSplitUserIds } }
          ]
        },
        { $or: candidates }
      ]
    }).populate('paidBy').populate('members.userId');
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
