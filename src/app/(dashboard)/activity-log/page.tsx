import { ActivityLogView } from '@/components/profile/ActivityLogView';

export const metadata = {
  title: 'Activity Log | Expense Tracker',
  description: 'View complete activity log, profile changes, security events, and transaction history across all devices.',
};

export default function ActivityLogPage() {
  return (
    <div className="w-full min-h-full bg-background">
      <ActivityLogView />
    </div>
  );
}
