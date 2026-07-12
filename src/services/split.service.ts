import { Types, default as mongoose } from 'mongoose';
import { generateRecordId } from '@/lib/generateRecordId';
import { splitRepository } from '@/repositories/split.repository';
import { splitUserRepository } from '@/repositories/split-user.repository';
import { userRepository } from '@/repositories/user.repository';
import type { SplitFormValues } from '@/lib/validations/split.schema';
import Split, { type ISplit, type ISplitMember } from '@/models/Split';
import SplitUser from '@/models/SplitUser';
import User from '@/models/User';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import Audit from '@/models/Audit';
import { notificationService } from '@/services/notification.service';

export class SplitError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function cents(value: number) {
  return Math.round(value * 100);
}

function dollars(value: number) {
  return Math.round(value) / 100;
}

function stringifyMongoId(value: unknown) {
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return stringifyMongoId((value as any)._id);
  }
  return String(value);
}

async function getOrCreateSplitCategory(userId: string | Types.ObjectId, session?: mongoose.ClientSession) {
  const category = await Category.findOne({ userId, name: 'Split' }).session(session || null);
  if (category) return category;

  return Category.create([{
    recordId: await generateRecordId('CAT'),
    userId: new Types.ObjectId(userId),
    name: 'Split',
    icon: 'FiGitBranch',
    color: '#F97316', // neon orange
    type: 'both',
    isDefault: false,
    subcategories: [],
  }], { session }).then((docs) => docs[0]);
}

function buildEqualShares(amount: number, members: SplitFormValues['members'], paidBy: string) {
  const totalCents = cents(amount);
  const base = Math.floor(totalCents / members.length);
  let remaining = totalCents;

  return members.map((member, index) => {
    const shareCents = index === members.length - 1 ? remaining : base;
    remaining -= shareCents;

    return {
      userId: new Types.ObjectId(member.userId),
      shareAmount: dollars(shareCents),
      paid: member.userId === paidBy,
    };
  });
}

function buildCustomShares(amount: number, members: SplitFormValues['members'], paidBy: string) {
  const total = members.reduce((sum, member) => sum + cents(member.shareAmount ?? 0), 0);
  if (Math.abs(total - cents(amount)) > 1) {
    throw new SplitError('Custom shares must add up to the total amount.', 422);
  }

  return members.map((member) => ({
    userId: new Types.ObjectId(member.userId),
    shareAmount: dollars(cents(member.shareAmount ?? 0)),
    paid: member.userId === paidBy,
  }));
}

async function normalizeMembers(userId: string, input: SplitFormValues) {
  const memberIds = [...new Set(input.members.map((member) => member.userId))];
  if (!memberIds.includes(input.paidBy)) {
    throw new SplitError('Paid by must be one of the selected members.', 422);
  }

  const splitUsers = await splitUserRepository.findByIds(memberIds, userId);
  if (splitUsers.length !== memberIds.length) {
    throw new SplitError('One or more selected members are invalid.', 422);
  }

  return input.splitMode === 'equal'
    ? buildEqualShares(input.amount, input.members, input.paidBy)
    : buildCustomShares(input.amount, input.members, input.paidBy);
}

export const splitService = {
  async list(userId: string, search?: string) {
    // 1. Ensure creator has a SplitUser entry
    await this.ensureCreatorSplitUser(userId);

    // 2. Perform search in repository
    const splits = await splitRepository.findAllForUser(userId, search);
    return splits.filter((s) => !s.deleted);
  },

  async get(userId: string, id: string) {
    const split = await splitRepository.findById(id, userId);
    if (!split || split.deleted) throw new SplitError('Split not found.', 404);
    return split;
  },

  async ensureCreatorSplitUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    const existing = await splitUserRepository.findByEmail(userId, user.email);
    if (!existing) {
      return splitUserRepository.create({
        recordId: await generateRecordId('USR'),
        userId: new Types.ObjectId(userId),
        name: user.name,
        email: user.email,
      });
    }
    return existing;
  },

  async create(userId: string, input: SplitFormValues) {
    const creatorSU = await this.ensureCreatorSplitUser(userId);
    if (!creatorSU) throw new SplitError('Could not verify creator.', 400);

    // Enforce creator is included in the split
    const creatorId = creatorSU._id.toString();
    const hasCreator = input.members.some((m) => m.userId === creatorId);
    if (!hasCreator) {
      throw new SplitError('Creator must be included in the split members.', 422);
    }

    // Enforce at least 2 members
    if (input.members.length < 2) {
      throw new SplitError('A split must contain at least 2 members.', 422);
    }

    // Prevent duplicate members
    const ids = input.members.map((m) => m.userId);
    if (new Set(ids).size !== ids.length) {
      throw new SplitError('Duplicate members are not allowed.', 422);
    }

    const members = await normalizeMembers(userId, input);

    // Setup transaction support
    const dbSession = await mongoose.startSession();
    let useTransaction = true;
    try {
      dbSession.startTransaction();
    } catch {
      useTransaction = false;
    }

    const createdDocs: { model: any; id: any }[] = [];

    try {
      const splitRecordId = await generateRecordId('SPL');
      const splitData = {
        recordId: splitRecordId,
        userId: new Types.ObjectId(userId),
        title: input.title,
        amount: input.amount,
        paidBy: new Types.ObjectId(input.paidBy),
        splitMode: input.splitMode,
        members,
        status: 'Pending',
        deleted: false,
      };

      const [split] = await Split.create([splitData], useTransaction ? { session: dbSession } : {});
      createdDocs.push({ model: Split, id: split._id });

      // Determine who paid
      const payerSplitUser = await SplitUser.findById(input.paidBy).session(useTransaction ? dbSession : null);
      if (!payerSplitUser) throw new SplitError('Payer not found.', 422);

      // 1. Create Payer Transaction (full Expense) if registered
      const payerUser = await User.findOne({ email: payerSplitUser.email.toLowerCase() }).session(useTransaction ? dbSession : null);
      if (payerUser) {
        const cat = await getOrCreateSplitCategory(payerUser._id, useTransaction ? dbSession : undefined);
        const txRecordId = await generateRecordId('EXP');
        const [tx] = await Transaction.create([{
          recordId: txRecordId,
          userId: payerUser._id,
          title: input.title,
          amount: input.amount,
          type: 'expense',
          category: cat._id,
          date: new Date(),
          note: `Paid full bill for split: ${input.title}`,
          splitId: split._id,
          splitRecordId,
          splitMembersCount: members.length,
          createdFrom: 'Split',
          createdBy: new Types.ObjectId(userId),
          transactionType: 'Split Expense',
          status: 'Paid',
        }], useTransaction ? { session: dbSession } : {});
        createdDocs.push({ model: Transaction, id: tx._id });
      }

      // 2. Create Receivers Transactions (Income shares) + Notifications
      const payerName = payerUser ? payerUser.name : payerSplitUser.name;
      for (const m of members) {
        if (m.userId.toString() === input.paidBy) continue; // Payer doesn't owe

        const subSplitUser = await SplitUser.findById(m.userId).session(useTransaction ? dbSession : null);
        if (!subSplitUser) continue;

        const subUser = await User.findOne({ email: subSplitUser.email.toLowerCase() }).session(useTransaction ? dbSession : null);
        if (subUser) {
          // Create Transaction
          const cat = await getOrCreateSplitCategory(subUser._id, useTransaction ? dbSession : undefined);
          const txRecordId = await generateRecordId('INC');
        const [tx] = await Transaction.create([{
          recordId: txRecordId,
          userId: subUser._id,
          title: input.title,
          amount: m.shareAmount,
          type: 'income',
          category: cat._id,
          date: new Date(),
          note: `Owed to ${payerName} for split: ${input.title}`,
          splitId: split._id,
          splitRecordId,
          splitMembersCount: members.length,
          createdFrom: 'Split',
          createdBy: new Types.ObjectId(userId),
          transactionType: 'Split Income',
          status: 'Pending',
        }], useTransaction ? { session: dbSession } : {});
        createdDocs.push({ model: Transaction, id: tx._id });
          // Create Notification
          const n = await notificationService.create(subUser._id.toString(), {
            title: `${payerName} added you to a split`,
            message: `You owe ₹${m.shareAmount} for "${input.title}"`,
            type: 'Split Created',
            relatedId: split._id.toString(),
          });
        }
      }

      // 3. Create Audit Log
      await Audit.create([{
        userId: new Types.ObjectId(userId),
        action: 'Split Created',
        details: { splitId: split._id, splitRecordId, title: input.title, amount: input.amount },
      }], useTransaction ? { session: dbSession } : {});

      if (useTransaction) {
        await dbSession.commitTransaction();
      }

      const populated = await Split.findById(split._id)
        .populate('paidBy')
        .populate('members.userId');
      return populated;
    } catch (err) {
      if (useTransaction) {
        await dbSession.abortTransaction();
      } else {
        // Manual Rollback Strategy
        for (const doc of createdDocs) {
          try {
            await doc.model.deleteOne({ _id: doc.id });
          } catch (cleanupErr) {
            console.error('Manual rollback failed for doc', doc.id, cleanupErr);
          }
        }
      }
      throw err;
    } finally {
      dbSession.endSession();
    }
  },

  async update(userId: string, id: string, input: Partial<SplitFormValues>) {
    const existing = await Split.findOne({ _id: id, userId }).populate('paidBy').populate('members.userId');
    if (!existing || existing.deleted) throw new SplitError('Split not found.', 404);

    if (existing.status === 'Completed') {
      throw new SplitError('Cannot update a completed split settlement.', 400);
    }

    const merged: SplitFormValues = {
      title: input.title ?? existing.title,
      amount: input.amount ?? existing.amount,
      paidBy: input.paidBy ?? stringifyMongoId(existing.paidBy),
      splitMode: input.splitMode ?? existing.splitMode,
      members:
        input.members ??
        existing.members.map((member: ISplitMember) => ({
          userId: stringifyMongoId(member.userId),
          shareAmount: member.shareAmount,
          paid: member.paid,
        })),
    };

    const creatorSU = await this.ensureCreatorSplitUser(userId);
    if (!creatorSU) throw new SplitError('Could not verify creator.', 400);

    // Enforce creator is included in the split
    const creatorId = creatorSU._id.toString();
    const hasCreator = merged.members.some((m) => m.userId === creatorId);
    if (!hasCreator) {
      throw new SplitError('Creator must be included in the split members.', 422);
    }

    // Enforce at least 2 members
    if (merged.members.length < 2) {
      throw new SplitError('A split must contain at least 2 members.', 422);
    }

    const members = await normalizeMembers(userId, merged);

    // Setup transaction support
    const dbSession = await mongoose.startSession();
    let useTransaction = true;
    try {
      dbSession.startTransaction();
    } catch {
      useTransaction = false;
    }

    try {
      // Deleting all old related transactions from this split to re-create
      await Transaction.deleteMany({ splitId: existing._id }).session(useTransaction ? dbSession : null);

      existing.title = merged.title;
      existing.amount = merged.amount;
      existing.paidBy = new Types.ObjectId(merged.paidBy);
      existing.splitMode = merged.splitMode;
      existing.members = members.map((m) => ({
        userId: m.userId,
        shareAmount: m.shareAmount,
        paid: m.paid,
      }));

      // Calculate status based on members paid state
      const payersCount = members.filter((m) => m.userId.toString() === merged.paidBy).length;
      const nonPayers = members.filter((m) => m.userId.toString() !== merged.paidBy);
      const paidNonPayers = nonPayers.filter((m) => m.paid);

      if (paidNonPayers.length === 0) {
        existing.status = 'Pending';
      } else if (paidNonPayers.length === nonPayers.length) {
        existing.status = 'Completed';
      } else {
        existing.status = 'Partially Paid';
      }

      await existing.save(useTransaction ? { session: dbSession } : {});

      // Determine who paid
      const payerSplitUser = await SplitUser.findById(merged.paidBy).session(useTransaction ? dbSession : null);
      if (!payerSplitUser) throw new SplitError('Payer not found.', 422);

      // Create payer transaction if registered
      const payerUser = await User.findOne({ email: payerSplitUser.email.toLowerCase() }).session(useTransaction ? dbSession : null);
      if (payerUser) {
        const cat = await getOrCreateSplitCategory(payerUser._id, useTransaction ? dbSession : undefined);
        const txRecordId = await generateRecordId('EXP');
        await Transaction.create([{
          recordId: txRecordId,
          userId: payerUser._id,
          title: merged.title,
          amount: merged.amount,
          type: 'expense',
          category: cat._id,
          date: new Date(),
          note: `Paid full bill for split: ${merged.title} (Updated)`,
          splitId: existing._id,
          splitRecordId: existing.recordId,
          splitMembersCount: members.length,
          createdFrom: 'Split',
          createdBy: new Types.ObjectId(userId),
          transactionType: 'Split Expense',
          status: 'Paid',
        }], useTransaction ? { session: dbSession } : {});
      }

      // Create receiver transactions if registered
      const payerName = payerUser ? payerUser.name : payerSplitUser.name;
      for (const m of members) {
        if (m.userId.toString() === merged.paidBy) continue;

        const subSplitUser = await SplitUser.findById(m.userId).session(useTransaction ? dbSession : null);
        if (!subSplitUser) continue;

        const subUser = await User.findOne({ email: subSplitUser.email.toLowerCase() }).session(useTransaction ? dbSession : null);
        if (subUser) {
          const cat = await getOrCreateSplitCategory(subUser._id, useTransaction ? dbSession : undefined);
          const txRecordId = await generateRecordId('INC');
          await Transaction.create([{
            recordId: txRecordId,
            userId: subUser._id,
            title: merged.title,
            amount: m.shareAmount,
            type: 'income',
            category: cat._id,
            date: new Date(),
            note: `Owed to ${payerName} for split: ${merged.title} (Updated)`,
            splitId: existing._id,
            splitRecordId: existing.recordId,
            splitMembersCount: members.length,
            createdFrom: 'Split',
            createdBy: new Types.ObjectId(userId),
            transactionType: 'Split Income',
            status: m.paid ? 'Paid' : 'Pending',
          }], useTransaction ? { session: dbSession } : {});
          // Send notification about update
          await notificationService.create(subUser._id.toString(), {
            title: `Split "${merged.title}" updated`,
            message: `Your share is now ₹${m.shareAmount}`,
            type: 'Split Created',
            relatedId: existing._id.toString(),
          });
        }
      }

      // Log Audit History
      await Audit.create([{
        userId: new Types.ObjectId(userId),
        action: 'Split Updated',
        details: { splitId: existing._id, title: merged.title, amount: merged.amount },
      }], useTransaction ? { session: dbSession } : {});

      if (useTransaction) {
        await dbSession.commitTransaction();
      }

      return existing.populate(['paidBy', 'members.userId']);
    } catch (err) {
      if (useTransaction) {
        await dbSession.abortTransaction();
      }
      throw err;
    } finally {
      dbSession.endSession();
    }
  },

  async markPaid(userId: string, splitId: string, memberId: string) {
    const split = await Split.findOne({ _id: splitId }).populate('paidBy').populate('members.userId');
    if (!split || split.deleted) throw new SplitError('Split not found.', 404);

    const creatorSU = await this.ensureCreatorSplitUser(split.userId.toString());
    if (!creatorSU) throw new SplitError('Could not verify creator.', 400);

    const payerId = stringifyMongoId(split.paidBy);

    // Find the member to pay
    const memberIndex = split.members.findIndex((m: any) => stringifyMongoId(m.userId) === memberId);
    if (memberIndex === -1) {
      throw new SplitError('Member is not part of this split.', 422);
    }

    const member = split.members[memberIndex];
    if (member.paid) {
      throw new SplitError('Member has already paid.', 400);
    }

    // Payer (who paid the bill) cannot mark themselves as paid since they already paid full bill
    if (memberId === payerId) {
      throw new SplitError('Payer cannot mark themselves as paid.', 400);
    }

    // Set transaction support
    const dbSession = await mongoose.startSession();
    let useTransaction = true;
    try {
      dbSession.startTransaction();
    } catch {
      useTransaction = false;
    }

    try {
      // 1. Update member payment status
      member.paid = true;

      // 2. Recalculate status of Split
      const nonPayers = split.members.filter((m: any) => stringifyMongoId(m.userId) !== payerId);
      const paidNonPayers = nonPayers.filter((m: any) => m.paid);

      if (paidNonPayers.length === nonPayers.length) {
        split.status = 'Completed';
      } else {
        split.status = 'Partially Paid';
      }

      await split.save(useTransaction ? { session: dbSession } : {});

      // Get target user names
      const payerSplitUser = await SplitUser.findById(payerId).session(useTransaction ? dbSession : null);
      const targetSplitUser = await SplitUser.findById(memberId).session(useTransaction ? dbSession : null);

      if (payerSplitUser && targetSplitUser) {
        // Send Notification to Creator
        const creatorUser = await User.findById(split.userId).session(useTransaction ? dbSession : null);
        if (creatorUser) {
          await notificationService.create(creatorUser._id.toString(), {
            title: `Split Paid by ${targetSplitUser.name}`,
            message: `${targetSplitUser.name} paid their share of ₹${member.shareAmount} for "${split.title}"`,
            type: 'Split Paid',
            relatedId: split._id.toString(),
          });
        }

        // Also notify the payer (the person who paid the bill) if different from creator
        const payerUser = await User.findOne({ email: payerSplitUser.email.toLowerCase() }).session(useTransaction ? dbSession : null);
        if (payerUser && payerUser._id.toString() !== split.userId.toString()) {
          await notificationService.create(payerUser._id.toString(), {
            title: `Split Paid by ${targetSplitUser.name}`,
            message: `${targetSplitUser.name} paid their share of ₹${member.shareAmount} for "${split.title}"`,
            type: 'Split Paid',
            relatedId: split._id.toString(),
          });
        }        // Create Settlement Transactions:
        // A. Payer (Payer receives Income share)
        if (payerUser) {
          const cat = await getOrCreateSplitCategory(payerUser._id, useTransaction ? dbSession : undefined);
          const txRecordId = await generateRecordId('INC');
          await Transaction.create([{
            recordId: txRecordId,
            userId: payerUser._id,
            title: `Settlement: ${split.title}`,
            amount: member.shareAmount,
            type: 'income',
            category: cat._id,
            date: new Date(),
            note: `Settlement received from ${targetSplitUser.name} for "${split.title}"`,
            splitId: split._id,
            splitRecordId: split.recordId,
            splitMembersCount: split.members.length,
            createdFrom: 'Split',
            createdBy: new Types.ObjectId(userId),
            transactionType: 'Split Settlement',
            status: 'Paid',
          }], useTransaction ? { session: dbSession } : {});
        }

        // B. Paying Member (Member pays Expense share)
        const targetUser = await User.findOne({ email: targetSplitUser.email.toLowerCase() }).session(useTransaction ? dbSession : null);
        if (targetUser) {
          const cat = await getOrCreateSplitCategory(targetUser._id, useTransaction ? dbSession : undefined);
          const txRecordId = await generateRecordId('EXP');
          await Transaction.create([{
            recordId: txRecordId,
            userId: targetUser._id,
            title: `Settlement: ${split.title}`,
            amount: member.shareAmount,
            type: 'expense',
            category: cat._id,
            date: new Date(),
            note: `Settled share of bill with ${payerSplitUser.name} for "${split.title}"`,
            splitId: split._id,
            splitRecordId: split.recordId,
            splitMembersCount: split.members.length,
            createdFrom: 'Split',
            createdBy: new Types.ObjectId(userId),
            transactionType: 'Split Settlement',
            status: 'Paid',
          }], useTransaction ? { session: dbSession } : {});
          // Also mark the original pending Split Income transaction as Paid
          await Transaction.updateOne(
            { splitId: split._id, userId: targetUser._id, transactionType: 'Split Income' },
            { $set: { status: 'Paid' } }
          ).session(useTransaction ? dbSession : null);
        }
      }

      // Log Audit History
      await Audit.create([{
        userId: new Types.ObjectId(userId),
        action: 'Marked Paid',
        details: { splitId: split._id, memberId, amount: member.shareAmount },
      }], useTransaction ? { session: dbSession } : {});

      if (useTransaction) {
        await dbSession.commitTransaction();
      }

      return split.populate(['paidBy', 'members.userId']);
    } catch (err) {
      if (useTransaction) {
        await dbSession.abortTransaction();
      }
      throw err;
    } finally {
      dbSession.endSession();
    }
  },

  async remove(userId: string, id: string) {
    const existing = await Split.findOne({ _id: id, userId });
    if (!existing || existing.deleted) throw new SplitError('Split not found.', 404);

    // Prevent deletion of completed settlements
    if (existing.status === 'Completed') {
      throw new SplitError('Cannot delete a completed split settlement.', 400);
    }

    const dbSession = await mongoose.startSession();
    let useTransaction = true;
    try {
      dbSession.startTransaction();
    } catch {
      useTransaction = false;
    }

    try {
      // Soft Delete the split
      existing.deleted = true;
      await existing.save(useTransaction ? { session: dbSession } : {});

      // Delete/Cleanup original transactions associated with this split if not settled
      await Transaction.deleteMany({ splitId: existing._id }).session(useTransaction ? dbSession : null);

      // Log Audit History
      await Audit.create([{
        userId: new Types.ObjectId(userId),
        action: 'Split Deleted',
        details: { splitId: existing._id, recordId: existing.recordId },
      }], useTransaction ? { session: dbSession } : {});

      if (useTransaction) {
        await dbSession.commitTransaction();
      }

      return existing;
    } catch (err) {
      if (useTransaction) {
        await dbSession.abortTransaction();
      }
      throw err;
    } finally {
      dbSession.endSession();
    }
  },
};
