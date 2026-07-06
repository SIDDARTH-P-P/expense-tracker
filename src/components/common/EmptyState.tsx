import type { IconType } from 'react-icons';
import { Button } from './Button';

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** An empty screen is an invitation to act — always pairs a clear next step. */
export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <Icon size={28} />
      </div>
      <h3 className="mb-1.5 font-display text-base font-semibold">{title}</h3>
      <p className="mb-5 max-w-xs text-sm text-muted">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
