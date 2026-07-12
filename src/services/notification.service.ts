import { Types } from 'mongoose';
import { generateRecordId } from '@/lib/generateRecordId';
import Notification, { type INotification } from '@/models/Notification';
import { connectDB } from '@/lib/db';

type SSEController = ReadableStreamDefaultController;

const globalForNotifications = global as unknown as {
  sseClients?: Map<string, Set<SSEController>>;
};

export const sseClients = globalForNotifications.sseClients || new Map<string, Set<SSEController>>();

if (process.env.NODE_ENV !== 'production') {
  globalForNotifications.sseClients = sseClients;
}

function sendSSEMessage(controller: SSEController, event: string, data: any) {
  try {
    controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  } catch (err) {
    // If enqueue fails, client might have disconnected. It will be cleaned up.
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
    this.broadcastUnreadCount(userId);

    return notification;
  },

  broadcastNotification(userId: string, notification: INotification) {
    const clients = sseClients.get(userId);
    if (!clients) return;

    const payload = {
      id: notification._id.toString(),
      recordId: notification.recordId,
      userId: notification.userId.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedId: notification.relatedId,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    };

    clients.forEach((controller) => {
      sendSSEMessage(controller, 'notification', payload);
    });
  },

  async broadcastUnreadCount(userId: string) {
    const clients = sseClients.get(userId);
    if (!clients || clients.size === 0) return;

    const count = await this.getUnreadCount(userId);
    clients.forEach((controller) => {
      sendSSEMessage(controller, 'unread_count', { count });
    });
  },

  broadcastSettingsUpdate(userId: string, settings: { theme?: string; currency?: string; language?: string }) {
    const clients = sseClients.get(userId);
    if (!clients || clients.size === 0) return;

    clients.forEach((controller) => {
      sendSSEMessage(controller, 'settings_update', settings);
    });
  },

  registerClient(userId: string, controller: SSEController) {
    if (!sseClients.has(userId)) {
      sseClients.set(userId, new Set());
    }
    const clients = sseClients.get(userId)!;
    clients.add(controller);

    // Send initial count
    this.getUnreadCount(userId).then((count) => {
      sendSSEMessage(controller, 'unread_count', { count });
    });

    return () => {
      clients.delete(controller);
      if (clients.size === 0) {
        sseClients.delete(userId);
      }
    };
  },
};

// Keep-alive timer
if (!(global as any).pingIntervalStarted) {
  (global as any).pingIntervalStarted = true;
  setInterval(() => {
    sseClients.forEach((clients) => {
      clients.forEach((controller) => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
        } catch {
          clients.delete(controller);
        }
      });
    });
  }, 20000);
}
