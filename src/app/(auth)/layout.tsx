import { FiZap } from 'react-icons/fi';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — hidden on mobile, sets the premium tone on larger screens */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary via-primary to-income p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
            <FiZap size={20} />
          </div>
          <span className="font-display text-xl font-semibold">Ledgerly</span>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-3xl font-bold leading-tight">
            Every rupee, dollar, and euro — accounted for.
          </p>
          <p className="mt-4 text-sm opacity-85">
            Track spending, visualize your habits, and build savings with a finance app that feels as good as it looks.
          </p>
        </div>

        <p className="relative text-xs opacity-70">© {new Date().getFullYear()} Ledgerly. All rights reserved.</p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
