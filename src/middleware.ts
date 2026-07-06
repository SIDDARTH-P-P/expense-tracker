import { NextRequest, NextResponse } from 'next/server';

/**
 * Route-level guard. Runs on the edge before the request reaches a page,
 * redirecting unauthenticated users away from protected routes and
 * authenticated users away from the auth pages.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/transactions', '/categories', '/settings', '/profile'];
const AUTH_PREFIXES = ['/login', '/signup'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('et_access_token')?.value ?? req.cookies.get('et_refresh_token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/transactions/:path*', '/categories/:path*', '/settings/:path*', '/profile/:path*', '/login', '/signup'],
};
