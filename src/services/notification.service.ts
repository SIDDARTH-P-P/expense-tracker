import { Types } from 'mongoose';
import { generateRecordId } from '@/lib/generateRecordId';
import Notification, { type INotification } from '@/models/Notification';
import { connectDB } from '@/lib/db';

type SSEController = ReadableStreamDefaultController;

const globalForNotifications = global as unknown as {
  sseClients?: Map<string, Set<SSEController>>;
};

export const sseClients = globalForNotifications.sseClients || new Map<string, Set<SSEController>>();
globalForNotifications.sseClients = sseClients;

function sendSSEMessage(controller: SSEController, event: string, data: any): boolean {
  try {
    controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    return true;
  } catch (err) {
    return false;
  }
}

export const notificationService = {
  async list(userId: string) {
    await connectDB();
    return Notification.find({ userId }).sort({ createdAt: -1 });
  },

  async getUnreadCount(userId: string): Promise<number> {
    await connectDB();
    return Notification.countDocuments({ userId, read: false });
  },

  async markRead(userId: string, id: string) {
    await connectDB();
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );
    this.broadcastUnreadCount(userId);
    return notification;
  },

  async markAllRead(userId: string) {
    await connectDB();
    await Notification.updateMany({ userId, read: false }, { read: true });
    this.broadcastUnreadCount(userId);
  },

  async create(userId: string, data: {
    title: string;
    message: string;
    type: INotification['type'];
    relatedId?: string | null;
  }) {
    await connectDB();
    const recordId = await generateRecordId('NTF');
    const notification = await Notification.create({
      ...data,
      recordId,
      userId: new Types.ObjectId(userId),
    });

    // Notify connected SSE clients for this user
    this.broadcastNotification(userId, notification);
    await this.broadcastUnreadCount(userId);

    return notification;
  },

  broadcastNotification(userId: string, notification: INotification) {
    const key = String(userId);
    const clients = sseClients.get(key);
    if (!clients || clients.size === 0) return;

    const createdAtStr = notification.createdAt
      ? new Date(notification.createdAt).toISOString()
      : new Date().toISOString();

    const updatedAtStr = notification.updatedAt
      ? new Date(notification.updatedAt).toISOString()
      : new Date().toISOString();

    const payload = {
      id: notification._id.toString(),
      recordId: notification.recordId,
      userId: notification.userId.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedId: notification.relatedId,
      read: Boolean(notification.read),
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };

    const dead: SSEController[] = [];
    clients.forEach((controller) => {
      const sent = sendSSEMessage(controller, 'notification', payload);
      if (!sent) dead.push(controller);
    });
    dead.forEach((c) => clients.delete(c));
    if (clients.size === 0) sseClients.delete(key);
  },

  async broadcastUnreadCount(userId: string) {
    const key = String(userId);
    const clients = sseClients.get(key);
    if (!clients || clients.size === 0) return;

    const count = await this.getUnreadCount(userId);
    const dead: SSEController[] = [];
    clients.forEach((controller) => {
      const sent = sendSSEMessage(controller, 'unread_count', { count });
      if (!sent) dead.push(controller);
    });
    dead.forEach((c) => clients.delete(c));
    if (clients.size === 0) sseClients.delete(key);
  },

  broadcastSettingsUpdate(userId: string, settings: { theme?: string; currency?: string; language?: string }) {
    const key = String(userId);
    const clients = sseClients.get(key);
    if (!clients || clients.size === 0) return;

    const dead: SSEController[] = [];
    clients.forEach((controller) => {
      const sent = sendSSEMessage(controller, 'settings_update', settings);
      if (!sent) dead.push(controller);
    });
    dead.forEach((c) => clients.delete(c));
    if (clients.size === 0) sseClients.delete(key);
  },

  broadcastSessionRevoked(userId: string, payload: { revokedSessionId?: string; revokeAllOthers?: boolean; currentSessionId?: string }) {
    const key = String(userId);
    const clients = sseClients.get(key);
    if (!clients || clients.size === 0) return;

    const dead: SSEController[] = [];
    clients.forEach((controller) => {
      const sent = sendSSEMessage(controller, 'session_revoked', payload);
      if (!sent) dead.push(controller);
    });
    dead.forEach((c) => clients.delete(c));
    if (clients.size === 0) sseClients.delete(key);
  },

  broadcastChatMessage(userId: string, payload: any) {
    const key = String(userId);
    const clients = sseClients.get(key);
    if (!clients || clients.size === 0) return;

    const dead: SSEController[] = [];
    clients.forEach((controller) => {
      const sent = sendSSEMessage(controller, 'chat_message', payload);
      if (!sent) dead.push(controller);
    });
    dead.forEach((c) => clients.delete(c));
    if (clients.size === 0) sseClients.delete(key);
  },

  registerClient(userId: string, controller: SSEController) {
    const key = String(userId);
    if (!sseClients.has(key)) {
      sseClients.set(key, new Set());
    }
    const clients = sseClients.get(key)!;
    clients.add(controller);

    // Send initial count
    this.getUnreadCount(userId).then((count) => {
      sendSSEMessage(controller, 'unread_count', { count });
    });

    return () => {
      clients.delete(controller);
      if (clients.size === 0) {
        sseClients.delete(key);
      }
    };
  },
};

// Keep-alive timer
if (!(global as any).pingIntervalStarted) {
  (global as any).pingIntervalStarted = true;
  setInterval(() => {
    sseClients.forEach((clients, userId) => {
      clients.forEach((controller) => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
        } catch {
          clients.delete(controller);
        }
      });
      if (clients.size === 0) {
        sseClients.delete(userId);
      }
    });
  }, 20000);
}

// Background Telegram update sync worker for connected SSE clients (0 browser GET requests!)
if (!(global as any).telegramBackgroundWorkerStarted) {
  (global as any).telegramBackgroundWorkerStarted = true;

  setInterval(async () => {
    try {
      if (sseClients.size === 0) return;

      const SupportTicket = (await import('@/models/SupportTicket')).default;
      const { syncTelegramUpdates } = await import('@/lib/telegram');

      for (const [userIdStr] of sseClients.entries()) {
        const activeTickets = await SupportTicket.find({
          userId: userIdStr,
          status: { $in: ['open', 'assigned'] },
        }).lean();

        for (const ticket of activeTickets) {
          await syncTelegramUpdates(userIdStr, (ticket as any).ticketId);
        }
      }
    } catch {
      // Ignore background errors
    }
  }, 3000);
}
