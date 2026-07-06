import { ProfileCard } from '@/components/profile/ProfileCard';

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted">Your account details and security.</p>
      </div>
      <ProfileCard />
    </div>
  );
}
