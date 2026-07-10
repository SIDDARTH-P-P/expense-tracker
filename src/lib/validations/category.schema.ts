import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(40),
  icon: z.string().min(1),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Provide a valid hex color'),
  type: z.enum(['income', 'expense', 'both']).default('expense'),
  subcategories: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1, 'Subcategory name is required').max(40),
    })
  ).default([]),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
