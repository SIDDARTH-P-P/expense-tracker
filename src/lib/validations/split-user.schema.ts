import { z } from 'zod';

export const splitUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().email('Enter a valid email address').max(120).transform((value) => value.toLowerCase()),
});

export type SplitUserFormValues = z.infer<typeof splitUserSchema>;
