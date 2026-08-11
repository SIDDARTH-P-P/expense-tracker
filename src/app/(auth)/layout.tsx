import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0D0F15] text-white">
      {/* Brand & Illustration panel — matches 1st phone screen from screenshot */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[#12141C] p-12 lg:flex lg:flex-col lg:justify-between border-r border-white/10">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Header Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 font-bold text-lg">
            V
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-white">VaultCash</span>
            <span className="text-[10px] text-white/50 font-medium">FINANCIAL SUITE</span>
          </div>
        </Link>

        {/* 3D Floating Wallet Graphic (Generated matching screenshot) */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
          <div className="relative w-full max-w-md h-72 rounded-3xl overflow-hidden shadow-2xl mb-8 border border-white/10 group">
            <Image
              src="/images/auth-wallet-3d.png"
              alt="3D Wallet Finance Illustration"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12141C] via-transparent to-transparent opacity-80" />
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">
            Easy way for all your transactions
          </h2>
          <p className="mt-3 text-sm text-white/60 max-w-sm">
            Manage your wallet, split bills with friends, and track every single expense effortlessly.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} VaultCash. All rights reserved.</p>
      </div>

      {/* Main Auth Form Container */}
      <div className="flex w-full flex-1 items-center justify-center bg-[#0D0F15] px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
