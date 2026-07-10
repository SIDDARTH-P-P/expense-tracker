import { Types } from 'mongoose';
import { generateRecordId } from '@/lib/generateRecordId';
import { splitRepository } from '@/repositories/split.repository';
import { splitUserRepository } from '@/repositories/split-user.repository';
import type { SplitFormValues } from '@/lib/validations/split.schema';
import type { ISplitMember } from '@/models/Split';

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
    return stringifyMongoId(value._id);
  }
  return String(value);
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
      paid: member.paid ?? member.userId === paidBy,
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
    paid: member.paid ?? member.userId === paidBy,
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
    return splitRepository.findAllForUser(userId, search);
  },

  async get(userId: string, id: string) {
    const split = await splitRepository.findById(id, userId);
    if (!split) throw new SplitError('Split not found.', 404);
    return split;
  },

  async create(userId: string, input: SplitFormValues) {
    const members = await normalizeMembers(userId, input);

    return splitRepository.create({
      recordId: await generateRecordId('SPL'),
      userId: new Types.ObjectId(userId),
      title: input.title,
      amount: input.amount,
      paidBy: new Types.ObjectId(input.paidBy),
      splitMode: input.splitMode,
      members,
    });
  },

  async update(userId: string, id: string, input: Partial<SplitFormValues>) {
    const existing = await splitRepository.findById(id, userId);
    if (!existing) throw new SplitError('Split not found.', 404);

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

    const members = await normalizeMembers(userId, merged);
    const updated = await splitRepository.updateById(id, userId, {
      title: merged.title,
      amount: merged.amount,
      paidBy: new Types.ObjectId(merged.paidBy),
      splitMode: merged.splitMode,
      members,
    });
    if (!updated) throw new SplitError('Split not found.', 404);
    return updated;
  },

  async remove(userId: string, id: string) {
    const deleted = await splitRepository.deleteById(id, userId);
    if (!deleted) throw new SplitError('Split not found.', 404);
    return deleted;
  },
};
