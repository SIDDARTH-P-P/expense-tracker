'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiLock, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCurrentUser } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { changePasswordSchema } from '@/lib/validations/auth.schema';
import { apiClient, ApiClientError } from '@/services/api-client';

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ProfileCard() {
  const { data: user, isLoading } = useCurrentUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onChangePassword(values: ChangePasswordValues) {
    setIsSaving(true);
    try {
      await apiClient.post('/auth/change-password', values);
      toast.success('Password updated.');
      reset();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not update password.');
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setAvatar(user.avatar ?? '');
  }, [user]);

  if (isLoading || !user) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-6">
        <Avatar name={name || user.name} src={avatar || undefined} size={64} />
        <div>
          <p className="font-display text-lg font-semibold">{user.name}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <FiMail size={13} /> {user.email}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6">
        <div className="mb-5 rounded-3xl border border-border bg-surface-2 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-semibold">Profile details</p>
              <p className="text-sm text-muted">Update your name, email, or upload an avatar.</p>
            </div>
            <label
              htmlFor="avatar-upload"
              className="inline-flex cursor-pointer items-center rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
            >
              Upload image
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setAvatarFile(file);
                if (file) {
                  setAvatar(URL.createObjectURL(file));
                }
              }}
            />
          </div>
          {avatarFile && (
            <p className="text-sm text-muted">Selected image: {avatarFile.name}</p>
          )}
        </div>
        <form className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <div className="sm:col-span-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => toast.success('Profile updated successfully.')}
            >
              Save profile
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
          <FiLock size={16} /> Change password
        </h3>
        <form onSubmit={handleSubmit(onChangePassword)} className="flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="New password"
            type="password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Button type="submit" className="w-full sm:w-auto" isLoading={isSaving}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
