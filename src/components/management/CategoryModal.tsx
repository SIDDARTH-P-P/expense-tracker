'use client';

import { CategoryForm } from '@/components/forms/CategoryForm';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import type { Category } from '@/types';
import type { CategoryFormValues } from '@/lib/validations/category.schema';

interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
}

export function CategoryModal({ category, onClose }: CategoryModalProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEditing = !!category;

  function submit(values: CategoryFormValues) {
    if (category) {
      updateCategory.mutate({ id: category.id, input: values }, { onSuccess: onClose });
      return;
    }

    createCategory.mutate(values, { onSuccess: onClose });
  }

  return (
    <CategoryForm
      initialData={category ?? undefined}
      isSubmitting={isEditing ? updateCategory.isPending : createCategory.isPending}
      onSubmit={submit}
      onCancel={onClose}
    />
  );
}
