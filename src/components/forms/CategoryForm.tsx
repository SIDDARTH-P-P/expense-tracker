'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategoryFormValues } from '@/lib/validations/category.schema';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import type { Category } from '@/types';

const SWATCHES = ['#2DD4BF', '#34D399', '#FB7185', '#F5A623', '#818CF8', '#F472B6', '#38BDF8', '#A78BFA'];

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (values: CategoryFormValues) => void;
  isSubmitting?: boolean;
}

export function CategoryForm({ initialData, onSubmit, isSubmitting }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ?? { icon: 'FiTag', color: SWATCHES[0], type: 'expense' },
  });

  const color = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Category name" placeholder="e.g. Subscriptions" error={errors.name?.message} {...register('name')} />

      <Select label="Applies to" {...register('type')}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
        <option value="both">Both</option>
      </Select>

      <div>
        <p className="mb-2 text-sm font-medium">Color</p>
        <div className="flex flex-wrap gap-2.5">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Choose color ${swatch}`}
              onClick={() => setValue('color', swatch)}
              style={{ backgroundColor: swatch }}
              className={`h-9 w-9 rounded-full transition-transform ${
                color === swatch ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface ring-foreground' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        {initialData ? 'Save changes' : 'Create category'}
      </Button>
    </form>
  );
}
