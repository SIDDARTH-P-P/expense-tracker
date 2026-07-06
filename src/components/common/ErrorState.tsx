import { FiAlertCircle } from 'react-icons/fi';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this. Check your connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-expense/10 text-expense">
        <FiAlertCircle size={28} />
      </div>
      <h3 className="mb-1.5 font-display text-base font-semibold">{title}</h3>
      <p className="mb-5 max-w-xs text-sm text-muted">{description}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
