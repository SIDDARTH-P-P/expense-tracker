'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { splitUserSchema, type SplitUserFormValues } from '@/lib/validations/split-user.schema';
import { useCreateSplitUser, useUpdateSplitUser } from '@/hooks/useManagement';
import type { SplitUser } from '@/types';

interface SplitUserModalProps {
  splitUser?: SplitUser | null;
  onClose: () => void;
}

export function SplitUserModal({ splitUser, onClose }: SplitUserModalProps) {
  const createSplitUser = useCreateSplitUser();
  const updateSplitUser = useUpdateSplitUser();
  const isEditing = !!splitUser;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SplitUserFormValues>({
    resolver: zodResolver(splitUserSchema),
    defaultValues: splitUser ? { name: splitUser.name, email: splitUser.email } : { name: '', email: '' },
  });

  function submit(values: SplitUserFormValues) {
    if (splitUser) {
      updateSplitUser.mutate({ id: splitUser.id, input: values }, { onSuccess: onClose });
      return;
    }

    createSplitUser.mutate(values, { onSuccess: onClose });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {splitUser?.recordId && (
        <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Record ID</p>
          <p className="font-mono text-sm font-semibold text-primary">{splitUser.recordId}</p>
        </div>
      )}
      <Input label="Name" placeholder="e.g. Siddarth" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" placeholder="name@example.com" error={errors.email?.message} {...register('email')} />
      <Button type="submit" size="lg" className="w-full" isLoading={isEditing ? updateSplitUser.isPending : createSplitUser.isPending}>
        {isEditing ? 'Save changes' : 'Create split user'}
      </Button>
    </form>
  );
}
