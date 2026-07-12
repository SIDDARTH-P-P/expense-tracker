import { z } from 'zod';

export const splitMemberSchema = z.object({
  userId: z.string().min(1, 'Select a member'),
  shareAmount: z.coerce.number().min(0, 'Share cannot be negative').optional(),
  paid: z.boolean().optional(),
});

export const splitSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  paidBy: z.string().min(1, 'Paid by is required'),
  splitMode: z.enum(['equal', 'custom']).default('equal'),
  members: z.array(splitMemberSchema).min(2, 'Select at least 2 members'),
});

export type SplitFormValues = z.infer<typeof splitSchema>;
