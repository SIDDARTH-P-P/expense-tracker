import Audit, { IAuditDevice } from '@/models/Audit';
import { connectDB } from '@/lib/db';
import { UAParser } from 'ua-parser-js';
import type { NextRequest } from 'next/server';
import { Types } from 'mongoose';

export type AuditCategory =
  | 'PROFILE'
  | 'SECURITY'
  | 'TRANSACTION'
  | 'SPLIT'
  | 'CATEGORY'
  | 'NOTEBOOK'
  | 'AUTH'
  | 'GENERAL';

export interface AuditChangeItem {
  field: string;
  label?: string;
  oldValue: any;
  newValue: any;
}

export interface LogAuditOptions {
  userId: string | Types.ObjectId;
  action: string;
  category?: AuditCategory;
  title?: string;
  description?: string;
  details?: Record<string, any>;
  changes?: AuditChangeItem[];
  req?: NextRequest | Request | null;
  userAgent?: string;
  ip?: string;
}

/**
 * Extracts device, OS, browser, and IP information from HTTP request or headers
 */
export function extractDeviceInfo(
  req?: NextRequest | Request | null,
  customUserAgent?: string,
  customIp?: string
): IAuditDevice {
  let ua = customUserAgent || '';
  let rawIp = customIp || '';

  if (req) {
    if ('headers' in req && typeof req.headers.get === 'function') {
      ua = ua || req.headers.get('user-agent') || '';
      const forwarded = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      rawIp = rawIp || (forwarded ? forwarded.split(',')[0] : realIp) || '127.0.0.1';
    }
  }

  const parser = new UAParser(ua);
  const browserInfo = parser.getBrowser();
  const osInfo = parser.getOS();
  const deviceInfo = parser.getDevice();

  const browser =
    [browserInfo.name, browserInfo.version?.split('.')[0]].filter(Boolean).join(' ') ||
    'Unknown Browser';
  const os = [osInfo.name, osInfo.version].filter(Boolean).join(' ') || 'Unknown OS';

  let deviceType = 'Desktop';
  if (deviceInfo.type) {
    deviceType = deviceInfo.type.charAt(0).toUpperCase() + deviceInfo.type.slice(1);
  } else {
    const osLower = os.toLowerCase();
    if (osLower.includes('android') || osLower.includes('ios') || osLower.includes('iphone')) {
      deviceType = 'Mobile';
    } else if (osLower.includes('ipad') || osLower.includes('tablet')) {
      deviceType = 'Tablet';
    }
  }

  const deviceName = `${browser} on ${os}`;
  let cleanIp = rawIp ? rawIp.trim().replace(/^::ffff:/, '') : '127.0.0.1';
  if (cleanIp === '::1') cleanIp = '127.0.0.1';

  return {
    browser,
    os,
    deviceType,
    deviceName,
    ip: cleanIp,
    userAgent: ua,
  };
}

export class AuditService {
  /**
   * Log an activity record into MongoDB
   */
  async log({
    userId,
    action,
    category = 'GENERAL',
    title,
    description,
    details = {},
    changes = [],
    req,
    userAgent,
    ip,
  }: LogAuditOptions) {
    try {
      await connectDB();
      const device = extractDeviceInfo(req, userAgent, ip);

      const mergedDetails: Record<string, any> = {
        title: title || action.replace(/_/g, ' '),
        description: description || '',
        ...details,
      };

      if (changes && changes.length > 0) {
        mergedDetails.changes = changes;
      }

      const auditRecord = await Audit.create({
        userId: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
        action,
        category,
        details: mergedDetails,
        device,
        timestamp: new Date(),
      });

      return auditRecord;
    } catch (error) {
      console.error('Failed to log audit activity:', error);
      // Best-effort; don't break main app execution
      return null;
    }
  }

  /**
   * Helper: Log profile information changes
   */
  async logProfileUpdate(
    userId: string | Types.ObjectId,
    changes: AuditChangeItem[],
    req?: NextRequest | Request | null
  ) {
    if (changes.length === 0) return;
    const changedFields = changes.map((c) => c.label || c.field).join(', ');
    return this.log({
      userId,
      action: 'PROFILE_UPDATE',
      category: 'PROFILE',
      title: 'Profile Updated',
      description: `Updated profile field(s): ${changedFields}`,
      changes,
      req,
    });
  }

  /**
   * Helper: Log password change
   */
  async logPasswordChange(userId: string | Types.ObjectId, req?: NextRequest | Request | null) {
    return this.log({
      userId,
      action: 'PASSWORD_CHANGE',
      category: 'SECURITY',
      title: 'Password Changed',
      description: 'Account password was successfully updated.',
      req,
    });
  }

  /**
   * Helper: Log user login
   */
  async logLogin(
    userId: string | Types.ObjectId,
    req?: NextRequest | Request | null,
    extraInfo?: Record<string, any>
  ) {
    return this.log({
      userId,
      action: 'LOGIN',
      category: 'AUTH',
      title: 'Device Signed In',
      description: 'New session initiated on this device.',
      details: extraInfo,
      req,
    });
  }

  /**
   * Helper: Log transaction operations (Create, Update, Delete)
   */
  async logTransaction(
    userId: string | Types.ObjectId,
    action: 'TRANSACTION_CREATE' | 'TRANSACTION_UPDATE' | 'TRANSACTION_DELETE',
    tx: Record<string, any>,
    changes?: AuditChangeItem[],
    req?: NextRequest | Request | null
  ) {
    const titles: Record<string, string> = {
      TRANSACTION_CREATE: 'Transaction Added',
      TRANSACTION_UPDATE: 'Transaction Updated',
      TRANSACTION_DELETE: 'Transaction Deleted',
    };

    const currency = tx.currency || 'INR';
    const amountStr = `${currency} ${Number(tx.amount || 0).toLocaleString()}`;
    const typeLabel = tx.type ? (tx.type.charAt(0).toUpperCase() + tx.type.slice(1)) : 'Transaction';

    let desc = `${typeLabel} "${tx.title || 'Untitled'}" of ${amountStr}`;
    if (action === 'TRANSACTION_CREATE') desc = `Added ${desc}`;
    else if (action === 'TRANSACTION_UPDATE') desc = `Updated ${desc}`;
    else if (action === 'TRANSACTION_DELETE') desc = `Deleted ${desc}`;

    return this.log({
      userId,
      action,
      category: 'TRANSACTION',
      title: titles[action],
      description: desc,
      details: {
        transactionId: tx.id || tx._id,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        notebook: tx.notebook,
        date: tx.date,
      },
      changes,
      req,
    });
  }

  /**
   * Helper: Log split transaction operations
   */
  async logSplit(
    userId: string | Types.ObjectId,
    action: 'SPLIT_CREATE' | 'SPLIT_UPDATE' | 'SPLIT_DELETE' | 'SPLIT_SETTLE',
    split: Record<string, any>,
    changes?: AuditChangeItem[],
    req?: NextRequest | Request | null
  ) {
    const titles: Record<string, string> = {
      SPLIT_CREATE: 'Split Expense Created',
      SPLIT_UPDATE: 'Split Expense Updated',
      SPLIT_DELETE: 'Split Expense Deleted',
      SPLIT_SETTLE: 'Split Payment Settled',
    };

    let desc = `Split "${split.title || 'Untitled'}"`;
    if (action === 'SPLIT_CREATE') desc = `Created ${desc} for amount ${split.totalAmount || 0}`;
    else if (action === 'SPLIT_SETTLE') desc = `Recorded settlement payment for ${desc}`;

    return this.log({
      userId,
      action,
      category: 'SPLIT',
      title: titles[action],
      description: desc,
      details: {
        splitId: split.id || split._id,
        title: split.title,
        totalAmount: split.totalAmount,
        splitType: split.splitType,
        participantCount: split.participants?.length || 0,
      },
      changes,
      req,
    });
  }

  /**
   * Helper: Log category operations
   */
  async logCategory(
    userId: string | Types.ObjectId,
    action: 'CATEGORY_CREATE' | 'CATEGORY_UPDATE' | 'CATEGORY_DELETE',
    cat: Record<string, any>,
    changes?: AuditChangeItem[],
    req?: NextRequest | Request | null
  ) {
    const titles: Record<string, string> = {
      CATEGORY_CREATE: 'Category Created',
      CATEGORY_UPDATE: 'Category Updated',
      CATEGORY_DELETE: 'Category Deleted',
    };

    return this.log({
      userId,
      action,
      category: 'CATEGORY',
      title: titles[action],
      description: `${action.includes('CREATE') ? 'Created' : action.includes('UPDATE') ? 'Updated' : 'Deleted'} category "${cat.name || cat.label || 'Category'}"`,
      details: {
        categoryId: cat.id || cat._id,
        name: cat.name || cat.label,
        type: cat.type,
      },
      changes,
      req,
    });
  }

  /**
   * Helper: Log notebook/collection operations
   */
  async logNotebook(
    userId: string | Types.ObjectId,
    action: 'NOTEBOOK_CREATE' | 'NOTEBOOK_UPDATE' | 'NOTEBOOK_DELETE',
    notebook: Record<string, any>,
    changes?: AuditChangeItem[],
    req?: NextRequest | Request | null
  ) {
    const titles: Record<string, string> = {
      NOTEBOOK_CREATE: 'Collection Created',
      NOTEBOOK_UPDATE: 'Collection Updated',
      NOTEBOOK_DELETE: 'Collection Deleted',
    };

    return this.log({
      userId,
      action,
      category: 'NOTEBOOK',
      title: titles[action],
      description: `${action.includes('CREATE') ? 'Created' : action.includes('UPDATE') ? 'Updated' : 'Deleted'} collection "${notebook.name || 'Collection'}"`,
      details: {
        notebookId: notebook.id || notebook._id,
        name: notebook.name,
      },
      changes,
      req,
    });
  }

  /**
   * Fetch paginated audit logs for a user
   */
  async getUserLogs(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      category?: string;
      search?: string;
    } = {}
  ) {
    await connectDB();
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const query: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (options.category && options.category !== 'ALL') {
      query.category = options.category;
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [
        { action: searchRegex },
        { 'details.title': searchRegex },
        { 'details.description': searchRegex },
        { 'details.changes.field': searchRegex },
        { 'details.changes.oldValue': searchRegex },
        { 'details.changes.newValue': searchRegex },
        { 'device.deviceName': searchRegex },
        { 'device.browser': searchRegex },
        { 'device.os': searchRegex },
        { 'device.ip': searchRegex },
      ];
    }

    const total = await Audit.countDocuments(query);
    const logs = await Audit.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const formattedLogs = logs.map((log: any) => ({
      id: String(log._id),
      action: log.action,
      category: log.category || 'GENERAL',
      title: log.details?.title || log.action?.replace(/_/g, ' '),
      description: log.details?.description || '',
      details: log.details || {},
      device: log.device || {
        browser: 'Unknown Browser',
        os: 'Unknown OS',
        deviceType: 'Desktop',
        deviceName: 'Unknown Device',
        ip: '127.0.0.1',
      },
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
    }));

    return {
      items: formattedLogs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }
}

export const auditService = new AuditService();
