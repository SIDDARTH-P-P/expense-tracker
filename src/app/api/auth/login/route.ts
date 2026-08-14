import { NextRequest } from 'next/server';
import { authService, AuthError } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';
import { loginSchema } from '@/lib/validations/auth.schema';
import { setAuthCookies, setSessionCookie, generateSessionId } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { UAParser } from 'ua-parser-js';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import { notificationService } from '@/services/notification.service';

// ─── IP Geolocation ──────────────────────────────────────────────────────────
async function getLocationFromIp(ip: string): Promise<string> {
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local network';
  }
  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=status,city,regionName,country`, {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    if (data.status === 'success') {
      return [data.city, data.country].filter(Boolean).join(', ') || 'Unknown location';
    }
  } catch {
    // Geo lookup is best-effort; don't fail login
  }
  return 'Unknown location';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Please check the form for errors.', 422, parsed.error.flatten().fieldErrors);
    }

    const { email, password, rememberMe } = parsed.data;

    let user;
    try {
      user = await authService.login(email, password);
    } catch (err) {
      const existingUser = await userRepository.findByEmail(email);
      if (!existingUser) {
        const defaultName = email.split('@')[0];
        user = await authService.signup(defaultName, email, password);
      } else {
        throw err;
      }
    }

    await setAuthCookies(
      { userId: String(user._id), email: user.email, role: user.role ?? 'user' },
      rememberMe
    );

    // ── Build session metadata ─────────────────────────────────────────────
    const sessionId = generateSessionId();
    await setSessionCookie(sessionId, rememberMe);

    const ua = req.headers.get('user-agent') ?? '';
    const parser = new UAParser(ua);
    const browserInfo = parser.getBrowser();
    const osInfo = parser.getOS();

    const browserName = [browserInfo.name, browserInfo.version?.split('.')[0]].filter(Boolean).join(' ') || 'Unknown browser';
    const osName = [osInfo.name, osInfo.version].filter(Boolean).join(' ') || 'Unknown OS';
    const deviceName = `${browserName} on ${osName}`;

    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const rawIp = (forwarded ? forwarded.split(',')[0] : realIp) ?? '::1';
    const cleanIp = rawIp.trim().replace(/^::ffff:/, '');

    const location = await getLocationFromIp(cleanIp);

    const ttlDays = rememberMe ? 30 : 1;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await connectDB();

    // ── Check if other active sessions exist before creating this one ───────
    const userId = String(user._id);
    const existingSessionCount = await Session.countDocuments({ userId: user._id });

    await Session.create({
      userId: user._id,
      sessionId,
      deviceName,
      os: osName,
      browser: browserName,
      ip: cleanIp,
      location,
      loginAt: new Date(),
      lastSeenAt: new Date(),
      expiresAt,
    });

    try {
      const { auditService } = await import('@/services/audit.service');
      await auditService.logLogin(userId, req, { location });
    } catch {
      // Audit log is best-effort
    }

    // ── Send system notification & SSE alert to existing logged in sessions ──
    if (existingSessionCount > 0) {
      try {
        const locationStr = location !== 'Unknown location' && location !== 'Local network'
          ? ` from ${location}`
          : '';
        const ipStr = cleanIp && cleanIp !== '::1' ? ` (${cleanIp})` : '';

        await notificationService.create(userId, {
          title: '🔔 New Device Login',
          message: `A new login was detected on ${deviceName}${locationStr}${ipStr}.`,
          type: 'System',
        });
      } catch {
        // Notification is best-effort; don't block login
      }
    }

    return apiSuccess({
      id: userId,
      name: user.name,
      email: user.email,
      currency: user.currency,
      theme: user.theme,
      role: user.role ?? 'user',
    });
  } catch (err) {
    if (err instanceof AuthError) return apiError(err.message, err.status);
    console.error('Login error:', err);
    return apiError('Something went wrong while logging in.', 500);
  }
}
