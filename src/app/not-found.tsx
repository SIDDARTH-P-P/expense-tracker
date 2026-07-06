import Link from 'next/link';
import { FiCompass } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <FiCompass size={28} />
      </div>
      <h1 className="font-display text-2xl font-bold">Page not found</h1>
      <p className="max-w-xs text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/dashboard" className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
        Back to dashboard
      </Link>
    </div>
  );
}
