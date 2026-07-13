'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiCheck, FiUsers, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/management/LoadingSkeleton';
import { splitSchema, type SplitFormValues } from '@/lib/validations/split.schema';
import { useCreateSplit, useSplitUsers, useUpdateSplit } from '@/hooks/useManagement';
import { useCurrentUser } from '@/hooks/useAuth';
import { cn } from '@/lib/utils/cn';
import type { Split, SplitUser } from '@/types';

interface SplitModalProps {
  split?: Split | null;
  onClose: () => void;
  readOnly?: boolean;
  onEdit?: () => void;
}

function getSplitUserId(value: SplitUser | string) {
  return typeof value === 'string' ? value : value.id;
}

function getInitialValues(
  split: Split | null | undefined,
  creatorSplitUser: SplitUser | undefined
): SplitFormValues {
  if (split) {
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

  // New split — pre-add creator as a member & set as payer
  const creatorId = creatorSplitUser?.id ?? '';
  return {
    title: '',
    amount: 0,
    paidBy: creatorId,
    splitMode: 'equal',
    members: creatorId
      ? [{ userId: creatorId, shareAmount: 0, paid: true }]
      : [],
  };
}

export function SplitModal({ split, onClose, readOnly, onEdit }: SplitModalProps) {
  const { data: splitUsers = [], isLoading } = useSplitUsers();
  const { data: currentUser } = useCurrentUser();
  const createSplit = useCreateSplit();
  const updateSplit = useUpdateSplit();
  const isEditing = !!split;

  // Find which split user represents the logged-in user (creator)
  const creatorSplitUser = useMemo(() => {
    return splitUsers.find(
      (su) => su.email.toLowerCase() === currentUser?.email?.toLowerCase()
    );
  }, [splitUsers, currentUser]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SplitFormValues>({
    resolver: zodResolver(splitSchema),
    defaultValues: getInitialValues(split, creatorSplitUser),
  });

  // Safe effect: add creator to members once async data arrives.
  // Uses getValues() (not watch) so `members` is NOT in the dep array — no render loop.
  const creatorAddedRef = useRef(false);
  useEffect(() => {
    if (!creatorSplitUser || creatorAddedRef.current) return;
    const currentMembers = getValues('members') ?? [];
    const alreadyAdded = currentMembers.some(
      (m) => m.userId === creatorSplitUser.id
    );
    if (!alreadyAdded) {
      setValue(
        'members',
        [...currentMembers, { userId: creatorSplitUser.id, shareAmount: 0, paid: true }],
        { shouldDirty: true, shouldValidate: true }
      );
    }
    if (!getValues('paidBy')) {
      setValue('paidBy', creatorSplitUser.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    creatorAddedRef.current = true;
  }, [creatorSplitUser, getValues, setValue]);

  const watchedMembers = watch('members');
  const members = useMemo(() => watchedMembers ?? [], [watchedMembers]);
  const paidBy = watch('paidBy');
  const splitMode = watch('splitMode');
  const amount = Number(watch('amount') ?? 0);
  const selectedIds = useMemo(
    () => new Set(members.map((member) => member.userId)),
    [members]
  );

  // Google Pay style: auto-calculate equal share
  const equalShare = members.length > 0 ? amount / members.length : 0;

  // Custom mode: running total
  const customTotal = useMemo(
    () => members.reduce((sum, m) => sum + Number(m.shareAmount ?? 0), 0),
    [members]
  );
  const customRemaining = amount - customTotal;

  // Ensure paidBy stays valid when members change
  const paidByValid = paidBy && selectedIds.has(paidBy);

  function toggleSplitMode(mode: 'equal' | 'custom') {
    setValue('splitMode', mode, { shouldDirty: true, shouldValidate: true });
  }

  function toggleMember(splitUser: SplitUser) {
    // Creator cannot be removed
    if (creatorSplitUser && splitUser.id === creatorSplitUser.id) {
      return;
    }

    const exists = selectedIds.has(splitUser.id);
    const next = exists
      ? members.filter((member) => member.userId !== splitUser.id)
      : [
          ...members,
          { userId: splitUser.id, shareAmount: 0, paid: false },
        ];

    setValue('members', next, { shouldDirty: true, shouldValidate: true });

    // If paidBy was removed, reset to creator or first member
    if (exists && paidBy === splitUser.id) {
      const fallback = creatorSplitUser?.id ?? next[0]?.userId ?? '';
      setValue('paidBy', fallback, { shouldDirty: true, shouldValidate: true });
    }
  }

  function updateShare(userId: string, shareAmount: number) {
    setValue(
      'members',
      members.map((member) =>
        member.userId === userId ? { ...member, shareAmount } : member
      ),
      { shouldDirty: true, shouldValidate: true }
    );
  }

  function submit(values: SplitFormValues) {
    const payload: SplitFormValues = {
      ...values,
      members: values.members.map((member) => ({
        userId: member.userId,
        paid: member.userId === values.paidBy ? true : Boolean(member.paid),
        ...(values.splitMode === 'custom'
          ? { shareAmount: Number(member.shareAmount ?? 0) }
          : {}),
      })),
    };

    if (split) {
      updateSplit.mutate(
        { id: split.id, input: payload },
        { onSuccess: onClose }
      );
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
    <form onSubmit={handleSubmit(submit)} className="flex h-full min-h-0 flex-col bg-surface text-foreground">
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 sm:pb-28 sm:pt-6 flex flex-col gap-4">
      {/* Record ID (edit mode) */}
      {split?.recordId && (
        <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Record ID
          </p>
          <p className="font-mono text-sm font-semibold text-primary">
            {split.recordId}
          </p>
        </div>
      )}

      {/* Title & Amount */}
      <Input
        label="Title"
        placeholder="Trip to Goa"
        disabled={readOnly}
        error={errors.title?.message}
        {...register('title')}
      />
      <Input
        label="Total Amount"
        type="number"
        step="0.01"
        min="0.01"
        inputMode="decimal"
        placeholder="5200"
        disabled={readOnly}
        error={errors.amount?.message}
        {...register('amount', {
          setValueAs: (value) => (value === '' ? 0 : Number(value)),
        })}
      />

      {/* Google Pay-style Summary Banner */}
      {amount > 0 && members.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiDollarSign className="text-primary" size={16} />
            <span className="text-sm font-bold text-primary">Split Summary</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Total
              </p>
              <p className="font-mono text-sm font-bold text-foreground">
                ₹{amount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                People
              </p>
              <p className="font-mono text-sm font-bold text-foreground">
                {members.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Each
              </p>
              <p className="font-mono text-sm font-bold text-primary">
                ₹{splitMode === 'equal' ? equalShare.toFixed(2) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Paid By */}
      <Select label="Paid by" disabled={readOnly} error={errors.paidBy?.message} {...register('paidBy')}>
        <option value="">Select who paid</option>
        {splitUsers
          .filter((su) => selectedIds.has(su.id))
          .map((su) => (
            <option key={su.id} value={su.id}>
              {su.name}
              {creatorSplitUser && su.id === creatorSplitUser.id ? ' (You)' : ''}
            </option>
          ))}
      </Select>

      {/* Split Mode Toggle */}
      <input type="hidden" {...register('splitMode')} />
      <div>
        <p className="mb-2 text-sm font-medium">Split Mode</p>
        <div className={cn("grid grid-cols-2 gap-1.5 rounded-2xl bg-surface-2 p-1.5", readOnly && "pointer-events-none opacity-80")}>
          {(['equal', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => !readOnly && toggleSplitMode(mode)}
              className={cn(
                'h-10 rounded-xl text-sm font-bold capitalize transition',
                splitMode === mode
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              )}
            >
              {mode === 'equal' ? 'Split Equally' : 'Custom Amounts'}
            </button>
          ))}
        </div>
      </div>

      {/* Custom mode validation banner */}
      {splitMode === 'custom' && amount > 0 && members.length > 0 && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold',
            Math.abs(customRemaining) < 0.01
              ? 'bg-income/10 text-income'
              : 'bg-expense/10 text-expense'
          )}
        >
          <FiAlertCircle size={14} />
          {Math.abs(customRemaining) < 0.01 ? (
            <span>Amounts add up correctly ✓</span>
          ) : customRemaining > 0 ? (
            <span>₹{customRemaining.toFixed(2)} remaining to assign</span>
          ) : (
            <span>₹{Math.abs(customRemaining).toFixed(2)} over the total</span>
          )}
        </div>
      )}

      {/* Select Members */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Select Members</p>
          {errors.members && (
            <span className="text-xs text-expense">{errors.members.message}</span>
          )}
        </div>
        <div className={cn("flex flex-col gap-2", readOnly && "pointer-events-none opacity-85")}>
          {splitUsers.map((splitUser) => {
            const selected = selectedIds.has(splitUser.id);
            const member = members.find(
              (item) => item.userId === splitUser.id
            );
            const isCreator =
              creatorSplitUser && splitUser.id === creatorSplitUser.id;
            const isPayer = paidBy === splitUser.id;

            return (
              <div
                key={splitUser.id}
                className={cn(
                  'rounded-2xl border bg-surface p-3 transition-colors',
                  selected
                    ? 'border-primary/40 shadow-sm'
                    : 'border-border'
                )}
              >
                <button
                  type="button"
                  onClick={() => !isCreator && toggleMember(splitUser)}
                  disabled={!!isCreator}
                  className={cn(
                    'flex w-full items-center gap-3 text-left',
                    isCreator && 'cursor-default'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface-2',
                      isCreator && 'opacity-60'
                    )}
                  >
                    {selected && <FiCheck size={13} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block truncate text-sm font-semibold">
                        {splitUser.name}
                      </span>
                      {isCreator && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                          You
                        </span>
                      )}
                      {isPayer && (
                        <span className="rounded-full bg-income/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-income">
                          Payer
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {splitUser.email}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-primary">
                    {splitUser.recordId}
                  </span>
                </button>

                {/* Share display */}
                {selected && (
                  <div className="mt-3 flex items-center gap-3">
                    {splitMode === 'custom' ? (
                      <div className="flex-1">
                        <Input
                          aria-label={`${splitUser.name} share amount`}
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={readOnly}
                          inputMode="decimal"
                          placeholder="0.00"
                          value={member?.shareAmount ?? 0}
                          onChange={(event) =>
                            updateShare(
                              splitUser.id,
                              Number(event.target.value)
                            )
                          }
                        />
                      </div>
                    ) : (
                      <p className="flex-1 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
                        Share:{' '}
                        <span className="font-semibold text-foreground font-mono">
                          ₹{equalShare.toFixed(2)}
                        </span>
                      </p>
                    )}
                    {isPayer && (
                      <span className="rounded-xl bg-income/10 px-3 py-2 text-xs font-bold text-income">
                        Paid ✓
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 border-t border-border bg-surface px-4 py-3 sm:px-6 sm:py-4">
        {readOnly ? (
          <Button
            type="button"
            size="lg"
            className="w-full font-bold uppercase tracking-[0.08em]"
            onClick={onClose}
          >
            Close
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            className="w-full font-bold uppercase tracking-[0.08em]"
            isLoading={isEditing ? updateSplit.isPending : createSplit.isPending}
          >
            {isEditing ? 'Save changes' : 'Create split'}
          </Button>
        )}
      </div>
    </form>
  );
}
