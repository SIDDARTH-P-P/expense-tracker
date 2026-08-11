import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET as string;
const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY_DEFAULT = '1d';
const REFRESH_TOKEN_EXPIRY_REMEMBER = '30d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: JwtPayload, rememberMe = false): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? REFRESH_TOKEN_EXPIRY_REMEMBER : REFRESH_TOKEN_EXPIRY_DEFAULT,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

const ACCESS_COOKIE = 'et_access_token';
const REFRESH_COOKIE = 'et_refresh_token';

export async function setAuthCookies(payload: JwtPayload, rememberMe = false) {
  const cookieStore = await cookies();
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload, rememberMe);

  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, '', { path: '/', maxAge: 0 });
  cookieStore.set(REFRESH_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getCurrentUser(req?: NextRequest): Promise<JwtPayload | null> {
  // 1. If NextRequest is passed, check Authorization header first
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        const headerToken = authHeader.substring(7).trim();
        if (!headerToken) return null;
        // Strictly verify header token - if tampered/invalid, reject immediately!
        return verifyToken(headerToken);
      }
      return null; // Malformed Authorization header -> reject
    }
  }

  // 2. Check Cookie if no Authorization header present
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(ACCESS_COOKIE)?.value ?? cookieStore.get(REFRESH_COOKIE)?.value;
  if (!cookieToken) return null;

  // Strictly verify cookie token
  return verifyToken(cookieToken);
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
