'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiCheck, FiUsers } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/management/LoadingSkeleton';
import { splitSchema, type SplitFormValues } from '@/lib/validations/split.schema';
import { useCreateSplit, useSplitUsers, useUpdateSplit } from '@/hooks/useManagement';
import { cn } from '@/lib/utils/cn';
import type { Split, SplitUser } from '@/types';

interface SplitModalProps {
  split?: Split | null;
  onClose: () => void;
}

function getSplitUserId(value: SplitUser | string) {
  return typeof value === 'string' ? value : value.id;
}

function getSplitUserName(value: SplitUser | string) {
  return typeof value === 'string' ? value : value.name;
}

function getInitialValues(split?: Split | null): SplitFormValues {
  if (!split) {
    return { title: '', amount: 0, paidBy: '', splitMode: 'equal', members: [] };
  }

  return {
    title: split.title,
    amount: split.amount,
    paidBy: getSplitUserId(split.paidBy),
    splitMode: split.splitMode,
    members: split.members.map((member) => ({
      userId: getSplitUserId(member.userId),
      shareAmount: member.shareAmount,
      paid: member.paid,
    })),
  };
}

export function SplitModal({ split, onClose }: SplitModalProps) {
  const { data: splitUsers = [], isLoading } = useSplitUsers();
  const createSplit = useCreateSplit();
  const updateSplit = useUpdateSplit();
  const isEditing = !!split;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SplitFormValues>({
    resolver: zodResolver(splitSchema),
    defaultValues: getInitialValues(split),
  });

  const members = watch('members') ?? [];
  const paidBy = watch('paidBy');
  const splitMode = watch('splitMode');
  const amount = Number(watch('amount') ?? 0);
  const selectedIds = useMemo(() => new Set(members.map((member) => member.userId)), [members]);
  const equalShare = members.length > 0 ? amount / members.length : 0;

  useEffect(() => {
    if (paidBy && !selectedIds.has(paidBy)) {
      setValue('paidBy', members[0]?.userId ?? '', { shouldDirty: true, shouldValidate: true });
    }
  }, [members, paidBy, selectedIds, setValue]);

  function toggleSplitMode(mode: 'equal' | 'custom') {
    setValue('splitMode', mode, { shouldDirty: true, shouldValidate: true });
  }

  function toggleMember(splitUser: SplitUser) {
    const exists = selectedIds.has(splitUser.id);
    const next = exists
      ? members.filter((member) => member.userId !== splitUser.id)
      : [...members, { userId: splitUser.id, shareAmount: 0, paid: splitUser.id === paidBy }];

    setValue('members', next, { shouldDirty: true, shouldValidate: true });
    if (!paidBy && next.length > 0) setValue('paidBy', next[0].userId, { shouldDirty: true, shouldValidate: true });
  }

  function updateShare(userId: string, shareAmount: number) {
    setValue(
      'members',
      members.map((member) => (member.userId === userId ? { ...member, shareAmount } : member)),
      { shouldDirty: true, shouldValidate: true }
    );
  }

  function submit(values: SplitFormValues) {
    const payload: SplitFormValues = {
      ...values,
      members: values.members.map((member) => ({
        userId: member.userId,
        paid: member.userId === values.paidBy ? true : Boolean(member.paid),
        ...(values.splitMode === 'custom' ? { shareAmount: Number(member.shareAmount ?? 0) } : {}),
      })),
    };

    if (split) {
      updateSplit.mutate({ id: split.id, input: payload }, { onSuccess: onClose });
      return;
    }

    createSplit.mutate(payload, { onSuccess: onClose });
  }

  if (isLoading) return <LoadingSkeleton rows={3} />;

  if (splitUsers.length === 0) {
    return (
      <EmptyState
        icon={FiUsers}
        title="No Split Users Yet"
        description="Add split users before creating a split."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {split?.recordId && (
        <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Record ID</p>
          <p className="font-mono text-sm font-semibold text-primary">{split.recordId}</p>
        </div>
      )}

      <Input label="Title" placeholder="Trip to Goa" error={errors.title?.message} {...register('title')} />
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0.01"
        inputMode="decimal"
        placeholder="5200"
        error={errors.amount?.message}
        {...register('amount', { setValueAs: (value) => (value === '' ? 0 : Number(value)) })}
      />

      <Select label="Paid by" error={errors.paidBy?.message} {...register('paidBy')}>
        <option value="">Select member</option>
        {splitUsers
          .filter((splitUser) => selectedIds.has(splitUser.id))
          .map((splitUser) => (
            <option key={splitUser.id} value={splitUser.id}>
              {splitUser.name}
            </option>
          ))}
      </Select>

      <input type="hidden" {...register('splitMode')} />

      <div>
        <p className="mb-2 text-sm font-medium">Split Mode</p>
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface-2 p-1.5">
          {(['equal', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => toggleSplitMode(mode)}
              className={cn(
                'h-10 rounded-xl text-sm font-bold capitalize transition',
                splitMode === mode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted hover:text-foreground'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Select Members</p>
          {errors.members && <span className="text-xs text-expense">{errors.members.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          {splitUsers.map((splitUser) => {
            const selected = selectedIds.has(splitUser.id);
            const member = members.find((item) => item.userId === splitUser.id);
            return (
              <div key={splitUser.id} className="rounded-2xl border border-border bg-surface p-3">
                <button
                  type="button"
                  onClick={() => toggleMember(splitUser)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface-2'
                    )}
                  >
                    {selected && <FiCheck size={13} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{splitUser.name}</span>
                    <span className="block truncate text-xs text-muted">{splitUser.email}</span>
                  </span>
                  <span className="font-mono text-[10px] text-primary">{splitUser.recordId}</span>
                </button>

                {selected && (
                  <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
                    {splitMode === 'custom' ? (
                      <Input
                        aria-label={`${splitUser.name} share amount`}
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={member?.shareAmount ?? 0}
                        onChange={(event) => updateShare(splitUser.id, Number(event.target.value))}
                      />
                    ) : (
                      <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
                        Equal share: <span className="font-semibold text-foreground">{equalShare.toFixed(2)}</span>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setValue('paidBy', splitUser.id, { shouldDirty: true, shouldValidate: true })}
                      className={cn(
                        'h-10 rounded-xl px-3 text-xs font-bold transition',
                        paidBy === splitUser.id ? 'bg-income text-income-foreground' : 'bg-surface-2 text-muted hover:text-foreground'
                      )}
                    >
                      Paid
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" isLoading={isEditing ? updateSplit.isPending : createSplit.isPending}>
        {isEditing ? 'Save changes' : 'Create split'}
      </Button>
    </form>
  );
}
