import { SettingsList } from '@/components/settings/SettingsList';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Manage your preferences and account.</p>
      </div>
      <SettingsList />
    </div>
  );
}
