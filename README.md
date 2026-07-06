# Ledgerly — Premium Expense Tracker

A production-ready, full-stack expense tracker built with Next.js 15 (App Router), React 19,
TypeScript, MongoDB, and a glassmorphism-inspired design system. Mobile-first, dark/light mode,
JWT auth, real charts, and a repository/service-layer architecture underneath.

> **Scope note:** this repo implements the full architecture and every core flow (auth,
> transactions, categories, dashboard, charts, settings, profile, CSV/Excel export, responsive
> mobile-first UI, dark mode, loading/empty/error states). A few edges are intentionally left as
> clearly-marked extension points — transactional email for password reset, Cloudinary avatar
> upload, and PDF export — since they need real third-party credentials to be meaningful. Each is
> called out below with exactly where to plug it in.

## Tech stack

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, React Hook Form,
Zod, TanStack Query, Zustand, React Icons, Recharts, React Hot Toast.

**Backend:** Next.js API routes, MongoDB Atlas, Mongoose, JWT, bcryptjs.

## Architecture

```
src/
├── app/                     # Routes (App Router)
│   ├── (auth)/              # /login, /signup, /forgot-password — public
│   ├── (dashboard)/         # /dashboard, /transactions, /categories, /settings, /profile — protected
│   └── api/                 # REST API route handlers
├── components/
│   ├── common/              # Button, Input, Select, BottomSheet, Skeleton, EmptyState...
│   ├── layout/               # Header, Sidebar, BottomNav, AppShell, FloatingAddButton
│   ├── forms/                # TransactionForm, CategoryForm (RHF + Zod)
│   ├── dashboard/ charts/ transactions/ categories/ profile/ settings/
│   └── providers/            # React Query, Toaster, theme init
├── hooks/                    # useAuth, useTransactions, useCategories, useDashboard, useTheme...
├── services/                 # Backend business logic (auth/transaction/category/dashboard/settings)
│                              # + api-client.ts, the frontend fetch wrapper
├── repositories/              # Data-access layer — the only files that touch Mongoose queries
├── models/                    # Mongoose schemas (User, Transaction, Category, Settings)
├── middlewares/                # withAuth() wrapper for API routes
├── lib/                       # db connection, JWT/bcrypt helpers, Zod schemas, formatters
├── store/                      # Zustand: auth session, UI/theme state
├── types/                      # Shared TypeScript types
└── constants/                  # Default categories, currencies, nav items
```

**Why this layering:** API routes never touch Mongoose directly. They call a **service**
(business rules, error types), which calls a **repository** (the only place with `Model.find`,
`Model.create`, etc). This keeps route handlers thin, makes business logic unit-testable without
spinning up Next.js, and means swapping MongoDB for another store later only touches
`src/repositories/`.

## Features implemented

- **Auth:** signup, login (with Remember Me), logout, `/api/auth/me`, change password, JWT in
  httpOnly cookies, protected routes via `src/middleware.ts`, forgot-password scaffold.
- **Dashboard:** total balance, monthly income/expense/savings, today's spending, income vs
  expense trend (6-month area chart), income vs expense bar chart, recent transactions, top
  categories with progress bars — all animated with Framer Motion count-ups.
- **Transactions:** create/edit/delete/duplicate, search, filter by type/category/date, sort by
  date or amount, pagination, swipe-to-delete and long-press actions on mobile, CSV/Excel export.
- **Categories:** default seeded categories on signup, create/edit/delete custom categories,
  color + icon picker, protected default categories.
- **Settings:** theme toggle, currency, language, logout, delete-account confirmation dialog.
- **Profile:** avatar (initials fallback), change password.
- **UI system:** dark/light mode via CSS variables + Tailwind `class` strategy, glassmorphism
  surfaces, gradient hero card, rounded-2xl/3xl cards, loading skeletons, empty states, error
  states with retry, toast notifications, bottom sheet forms on mobile / centered modal on
  desktop, floating add button, bottom tab bar on mobile / sidebar on desktop.

## Design system

- **Palette:** deep charcoal-navy dark mode / cool off-white light mode, with a teal
  ("verdigris") primary, emerald for income, rose for expense — defined as CSS variables in
  `src/app/globals.css` so both themes and Tailwind stay in sync.
- **Type:** Space Grotesk for headings, Inter for body text, JetBrains Mono for every monetary
  amount (the `.amount` class) — a small "ledger" signature that makes numbers easy to scan and
  compare at a glance.

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in MONGODB_URI and JWT_SECRET in .env.local
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Create an account; ten default
categories are seeded automatically.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas (or local) connection string |
| `JWT_SECRET` | Yes | Long random string — `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | No | Used for metadata/email links |
| `CLOUDINARY_*` | No | Only needed if you wire up avatar upload |

## Extension points (clearly scaffolded, not wired to a real provider)

1. **Password reset emails** — `src/app/api/auth/forgot-password/route.ts` already generates the
   correct (non-leaking) response shape; add a signed reset token + call your email provider
   (Resend/SendGrid/SES) where the `TODO` comment is.
2. **Cloudinary avatar upload** — `User.avatar` and `Avatar.tsx` already support a `src` URL;
   add an upload route that pushes to Cloudinary and calls `PATCH /api/auth/me` (add that route)
   with the returned URL.
3. **PDF export** — `src/lib/utils/export.ts` has CSV and Excel export working end-to-end;
   add a `jspdf` + `jspdf-autotable` variant next to `exportTransactionsToExcel` for a third
   button in `TransactionsPage`.
4. **Account deletion** — the confirmation dialog in `SettingsList.tsx` is wired up but the
   destructive action itself is intentionally stubbed with a toast; add a `DELETE /api/auth/me`
   route calling `userRepository.deleteById` once you're comfortable with the cascade behavior
   (delete transactions/categories, or soft-delete).

## Deployment

### Vercel + MongoDB Atlas (recommended)

1. Push this repo to GitHub.
2. Create a free MongoDB Atlas cluster → get your connection string → whitelist `0.0.0.0/0` (or
   Vercel's IPs) under Network Access.
3. Import the repo into [Vercel](https://vercel.com/new).
4. Add `MONGODB_URI` and `JWT_SECRET` under Project Settings → Environment Variables.
5. Deploy. Vercel builds with `next build` automatically.

### Docker

```bash
cp .env.example .env
# fill in MONGODB_URI and JWT_SECRET
docker compose up --build
```

This builds a multi-stage image using Next.js's `output: 'standalone'` mode and runs it on
port 3000. A local `mongo` service is included in `docker-compose.yml` if you don't want to use
Atlas for local development — point `MONGODB_URI` at `mongodb://mongo:27017/expense-tracker`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Notes on the "production-ready" claims in the brief

This project was actually installed and built end-to-end (`npm install && npm run build`) to
catch real TypeScript/ESLint errors rather than just eyeballing the code — several genuine type
mismatches (Mongoose `ObjectId` vs `string`, an implicit-`any` index) were caught and fixed this
way. The one thing that couldn't be verified in the sandbox used to write this is fetching
Space Grotesk/Inter/JetBrains Mono from Google Fonts at build time, since that sandbox had no
general internet access — `next/font/google` will fetch and self-host them automatically the
first time you run `npm run build` or `npm run dev` with normal internet access, no action
needed on your end.
