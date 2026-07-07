import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ThemeInitializer } from '@/components/providers/ThemeInitializer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ledgerly — Track every rupee, dollar, and euro',
    template: '%s · Ledgerly ',
  },
  description:
    'A premium personal finance and expense tracker. Track income and expenses, visualize spending, and stay on top of your budget.',
  keywords: ['expense tracker', 'budget app', 'personal finance', 'money manager'],
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f9fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e14' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-body antialiased">
        <QueryProvider>
          <ThemeInitializer />
          {children}
          <ToastProvider />
        </QueryProvider>
      </body>
    </html>
  );
}
