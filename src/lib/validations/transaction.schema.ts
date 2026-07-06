import { z } from 'zod';

export const transactionSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']).default('card'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().max(500).optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
