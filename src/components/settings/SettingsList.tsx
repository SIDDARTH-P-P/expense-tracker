'use client';

import { FiMoon, FiSun, FiDollarSign, FiGlobe, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { Select } from '@/components/common/Select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CURRENCIES } from '@/constants/currencies';
import { apiClient } from '@/services/api-client';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'hi', label: 'Hindi' },
];

function SettingsRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-none">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-muted">
          <Icon size={16} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function SettingsList() {
  const { theme, toggleTheme } = useTheme();
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  async function updateCurrency(currency: string) {
    try {
      await apiClient.patch('/settings', { currency });
      toast.success('Currency updated.');
    } catch {
      toast.error('Could not update currency.');
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface px-5">
      <SettingsRow icon={theme === 'dark' ? FiMoon : FiSun} label="Theme">
        <button
          onClick={toggleTheme}
          className="rounded-full bg-surface-2 px-4 py-1.5 text-xs font-medium capitalize"
        >
          {theme}
        </button>
      </SettingsRow>

      <SettingsRow icon={FiDollarSign} label="Currency">
        <Select
          defaultValue={user?.currency ?? 'USD'}
          onChange={(e) => updateCurrency(e.target.value)}
          className="!h-9 w-32 text-xs"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} ({c.symbol})
            </option>
          ))}
        </Select>
      </SettingsRow>

      <SettingsRow icon={FiGlobe} label="Language">
        <Select defaultValue="en" className="!h-9 w-32 text-xs">
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </Select>
      </SettingsRow>

      <SettingsRow icon={FiLogOut} label="Log out">
        <button onClick={() => logout.mutate()} className="text-xs font-medium text-primary">
          Log out
        </button>
      </SettingsRow>

      <SettingsRow icon={FiTrash2} label="Delete account">
        <button onClick={() => setShowDeleteAccount(true)} className="text-xs font-medium text-expense">
          Delete
        </button>
      </SettingsRow>

      <ConfirmDialog
        isOpen={showDeleteAccount}
        title="Delete your account?"
        description="This permanently deletes your account and all transaction history. This can't be undone."
        confirmLabel="Delete account"
        onConfirm={() => {
          toast.error('Account deletion requires a confirmed backend endpoint — wire this up before going live.');
          setShowDeleteAccount(false);
        }}
        onCancel={() => setShowDeleteAccount(false)}
      />
    </div>
  );
}
