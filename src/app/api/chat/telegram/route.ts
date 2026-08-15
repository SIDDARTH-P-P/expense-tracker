import { NextRequest } from 'next/server';
import { withAuth } from '@/middlewares/with-auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import SupportTicket, { ISupportTicket } from '@/models/SupportTicket';
import User, { IUser } from '@/models/User';
import { sendTelegramMessage, sendTelegramMediaNotice, generateBotResponse, getTelegramBotInfo, syncTelegramUpdates } from '@/lib/telegram';

/**
 * Generate a clean Ticket ID (e.g. TK84920A)
 */
function generateTicketId(): string {
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TK${randomHex}`;
}

/**
 * GET /api/chat/telegram
 * Fetch user's support ticket, chat messages & sync Telegram replies
 */
export const GET = withAuth(async (req: NextRequest, authUser) => {
  try {
    await connectDB();

    // Find or create active support ticket in database collection
    let ticket = (await SupportTicket.findOne({ userId: authUser.userId, status: { $in: ['open', 'assigned'] } })
      .sort({ createdAt: -1 })
      .lean()) as ISupportTicket | null;

    if (!ticket) {
      const newTicketId = generateTicketId();
      const createdTicket = await SupportTicket.create({
        ticketId: newTicketId,
        userId: authUser.userId,
        status: 'open',
        assignedAgent: 'Expense Desk',
        subject: 'General Support Inquiry',
      });
      ticket = createdTicket.toObject() as ISupportTicket;
    }

    const ticketId = ticket.ticketId;

    // Two-way sync: Fetch any replies sent directly in Telegram app
    await syncTelegramUpdates(authUser.userId, ticketId);

    const messages = await ChatMessage.find({ userId: authUser.userId, ticketId })
      .sort({ createdAt: 1 })
      .lean();

    const dbUser = (await User.findById(authUser.userId).select('name email memberId').lean()) as IUser | null;
    const userName = dbUser?.name || 'User';

    // If ticket has no messages, seed initial welcome & options widgets
    if (messages.length === 0) {
      const welcomeText = `Hi ${userName}! Welcome to Expense Desk Support. How can we assist you with your expenses today?`;
      
      const welcomeMsg = await ChatMessage.create({
        userId: authUser.userId,
        ticketId,
        sender: 'bot',
        senderName: 'Expense Desk',
        text: welcomeText,
        type: 'text',
      });

      const optionsMsg = await ChatMessage.create({
        userId: authUser.userId,
        ticketId,
        sender: 'bot',
        senderName: 'Expense Desk',
        text: 'Anything else I can help you with?',
        type: 'options_widget',
      });

      return apiSuccess({
        ticketId,
        assignedAgent: ticket.assignedAgent || 'Expense Desk',
        messages: [
          {
            id: welcomeMsg._id.toString(),
            sender: welcomeMsg.sender,
            senderName: welcomeMsg.senderName,
            text: welcomeMsg.text,
            type: welcomeMsg.type,
            createdAt: welcomeMsg.createdAt.toISOString(),
          },
          {
            id: optionsMsg._id.toString(),
            sender: optionsMsg.sender,
            senderName: optionsMsg.senderName,
            text: optionsMsg.text,
            type: optionsMsg.type,
            createdAt: optionsMsg.createdAt.toISOString(),
          },
        ],
        botInfo: {
          username: 'ExpenseAssistant_bot',
          name: 'Expense Assistant',
          status: 'online',
        },
      });
    }

    const botInfo = await getTelegramBotInfo();

    return apiSuccess({
      ticketId,
      assignedAgent: ticket.assignedAgent || 'Expense Desk',
      messages: messages.map((m: any) => ({
        id: m._id ? m._id.toString() : String(m.id || Date.now()),
        sender: m.sender,
        senderName: m.senderName || 'Expense Desk',
        text: m.text || '',
        type: m.type || 'text',
        mediaUrl: m.mediaUrl || '',
        mediaName: m.mediaName || '',
        status: m.status || 'read',
        widgetData: m.widgetData,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      })),
      botInfo: {
        username: botInfo?.username || 'ExpenseAssistant_bot',
        name: botInfo?.first_name || 'Expense Assistant',
        status: 'online',
      },
    });
  } catch (err) {
    console.error('Fetch chat history error:', err);
    return apiError('Could not load chat history.', 500);
  }
});

/**
 * POST /api/chat/telegram
 * Send user message/media and receive Bot response
 */
export const POST = withAuth(async (req: NextRequest, authUser) => {
  try {
    const body = await req.json();
    const { message, type = 'text', mediaUrl, mediaName, ticketId: reqTicketId } = body;

    if (type === 'text' && (!message || typeof message !== 'string' || !message.trim())) {
      return apiError('Message cannot be empty.', 400);
    }

    await connectDB();

    // Ensure ticket ID exists
    let ticketId = reqTicketId;
    if (!ticketId) {
      let activeTicket = await SupportTicket.findOne({ userId: authUser.userId, status: { $in: ['open', 'assigned'] } });
      if (!activeTicket) {
        activeTicket = await SupportTicket.create({
          ticketId: generateTicketId(),
          userId: authUser.userId,
          status: 'open',
          assignedAgent: 'Expense Desk',
        });
      }
      ticketId = activeTicket.ticketId;
    }

    const dbUser = (await User.findById(authUser.userId).select('name email memberId username').lean()) as IUser | null;
    const userName = dbUser?.name || 'User';
    const userHandle = dbUser?.username ? `@${dbUser.username}` : dbUser?.email || '';
    const memberId = dbUser?.memberId || 'N/A';

    const text = message ? message.trim() : '';

    // 1. Dispatch media/text to Telegram Bot first to store media 100% on Telegram Cloud
    let storedMediaUrl = mediaUrl || '';
    const telegramNotice = `📩 <b>Support Ticket:</b> <code>${ticketId}</code>\n` +
      `👤 <b>User:</b> ${userName} (${userHandle})\n` +
      `🆔 <b>Member ID:</b> <code>${memberId}</code>\n` +
      `💬 <b>Content:</b> ${text || '[' + type.toUpperCase() + ' ATTACHMENT]'}`;

    if (type !== 'text' && mediaUrl) {
      const mediaResult = await sendTelegramMediaNotice(type as any, mediaUrl, mediaName || 'attachment', telegramNotice);
      if (mediaResult?.telegramFileUrl) {
        storedMediaUrl = mediaResult.telegramFileUrl; // Save light Telegram Cloud URL in MongoDB!
      }
    } else {
      await sendTelegramMessage(telegramNotice);
    }

    // 2. Save user message to database (stores only Telegram Cloud URL, NO Base64!)
    const userMsgDoc = await ChatMessage.create({
      userId: authUser.userId,
      ticketId,
      sender: 'user',
      senderName: userName,
      text,
      type,
      mediaUrl: storedMediaUrl,
      mediaName: mediaName || '',
      status: 'delivered',
    });

    // 3. Generate bot response
    const botReplyText = generateBotResponse(text, userName, type);

    // 4. Save bot message to database
    const botMsgDoc = await ChatMessage.create({
      userId: authUser.userId,
      ticketId,
      sender: 'bot',
      senderName: 'Expense Desk',
      text: botReplyText,
      type: 'text',
      status: 'read',
    });

    // Mark previous user messages as 'read'
    await ChatMessage.updateMany(
      { userId: authUser.userId, ticketId, sender: 'user' },
      { status: 'read' }
    );

    return apiSuccess({
      ticketId,
      userMessage: {
        id: userMsgDoc._id.toString(),
        sender: userMsgDoc.sender,
        senderName: userMsgDoc.senderName,
        text: userMsgDoc.text,
        type: userMsgDoc.type,
        mediaUrl: userMsgDoc.mediaUrl,
        mediaName: userMsgDoc.mediaName,
        status: 'read',
        createdAt: userMsgDoc.createdAt.toISOString(),
      },
      botMessage: {
        id: botMsgDoc._id.toString(),
        sender: botMsgDoc.sender,
        senderName: botMsgDoc.senderName,
        text: botMsgDoc.text,
        type: botMsgDoc.type,
        status: 'read',
        createdAt: botMsgDoc.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Send chat message error:', err);
    return apiError('Could not process chat message.', 500);
  }
});

/**
 * DELETE /api/chat/telegram
 * Clear user chat history
 */
export const DELETE = withAuth(async (req: NextRequest, authUser) => {
  try {
    await connectDB();
    await ChatMessage.deleteMany({ userId: authUser.userId });
    await SupportTicket.updateMany({ userId: authUser.userId }, { status: 'closed' });
    return apiSuccess({ success: true });
  } catch (err) {
    console.error('Clear chat error:', err);
    return apiError('Could not clear chat history.', 500);
  }
});
