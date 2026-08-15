import ChatMessage from '@/models/ChatMessage';
import SupportTicket from '@/models/SupportTicket';
import { notificationService } from '@/services/notification.service';

/**
 * Telegram Bot Integration Utility
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8981908671:AAGf_kvThZLqsmzE0Ko2a5nGA_3XgVFQ7zc';
let cachedChatId = process.env.TELEGRAM_CHAT_ID || '640885701';

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

/**
 * Fetch direct file download/view URL from Telegram Bot API using file_id
 */
export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
    }
  } catch (err) {
    console.error('Error fetching Telegram file URL:', err);
  }
  return null;
}

/**
 * Fetch the latest active Chat ID from Telegram getUpdates if missing
 */
export async function getLatestChatId(): Promise<string> {
  if (cachedChatId) return cachedChatId;

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
      const lastUpdate = data.result[data.result.length - 1];
      const chatId = String(lastUpdate?.message?.chat?.id || lastUpdate?.my_chat_member?.chat?.id || '');
      if (chatId) {
        cachedChatId = chatId;
        return chatId;
      }
    }
  } catch (err) {
    console.error('Failed to fetch Telegram chat ID:', err);
  }
  return '640885701';
}

/**
 * Get Telegram Bot information
 */
export async function getTelegramBotInfo(): Promise<TelegramBotInfo | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.ok) {
      return data.result as TelegramBotInfo;
    }
  } catch (err) {
    console.error('Failed to fetch Telegram bot info:', err);
  }
  return null;
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  text: string,
  chatId?: string
): Promise<{ ok: boolean; message_id?: number; error?: string }> {
  let targetChatId = chatId || process.env.TELEGRAM_CHAT_ID || cachedChatId;
  
  if (!targetChatId) {
    targetChatId = await getLatestChatId();
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { ok: true, message_id: data.result.message_id };
    } else {
      console.warn('Telegram API warning:', data.description);
      return { ok: false, error: data.description || 'Failed to send message to Telegram.' };
    }
  } catch (err) {
    console.error('Telegram API request error:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

/**
 * Send actual photo to Telegram Bot API and return Telegram Cloud hosted URL
 */
export async function sendTelegramPhoto(
  base64OrUrl: string,
  fileName: string,
  captionText: string,
  chatId?: string
): Promise<{ ok: boolean; message_id?: number; telegramFileUrl?: string }> {
  let targetChatId = chatId || process.env.TELEGRAM_CHAT_ID || cachedChatId;
  if (!targetChatId) targetChatId = await getLatestChatId();

  try {
    if (base64OrUrl.startsWith('data:')) {
      const parts = base64OrUrl.split(',');
      const meta = parts[0];
      const base64Data = parts[1];
      const mimeType = meta.split(';')[0].split(':')[1] || 'image/png';
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mimeType });

      const formData = new FormData();
      formData.append('chat_id', targetChatId);
      formData.append('caption', captionText);
      formData.append('parse_mode', 'HTML');
      formData.append('photo', blob, fileName || 'photo.png');

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.ok && data.result) {
        const photos = data.result.photo;
        const fileId = photos && photos.length > 0 ? photos[photos.length - 1].file_id : null;
        let telegramFileUrl = '';
        if (fileId) {
          telegramFileUrl = (await getTelegramFileUrl(fileId)) || '';
        }
        return { ok: true, message_id: data.result.message_id, telegramFileUrl };
      } else {
        console.error('Telegram sendPhoto failed:', data.description);
      }
    } else if (base64OrUrl.startsWith('http')) {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          photo: base64OrUrl,
          caption: captionText,
          parse_mode: 'HTML',
        }),
      });
      const data = await res.json();
      if (data.ok) return { ok: true, message_id: data.result.message_id, telegramFileUrl: base64OrUrl };
    }
  } catch (err) {
    console.error('Error sending photo to Telegram:', err);
  }

  // Fallback to text notice
  return sendTelegramMessage(`${captionText}\n<b>Media:</b> 🖼️ Attachment: ${fileName}`, targetChatId);
}

/**
 * Send actual document/audio file to Telegram Bot API and return Telegram Cloud hosted URL
 */
export async function sendTelegramDocument(
  base64OrUrl: string,
  fileName: string,
  captionText: string,
  chatId?: string
): Promise<{ ok: boolean; message_id?: number; telegramFileUrl?: string }> {
  let targetChatId = chatId || process.env.TELEGRAM_CHAT_ID || cachedChatId;
  if (!targetChatId) targetChatId = await getLatestChatId();

  try {
    if (base64OrUrl.startsWith('data:')) {
      const parts = base64OrUrl.split(',');
      const meta = parts[0];
      const base64Data = parts[1];
      const mimeType = meta.split(';')[0].split(':')[1] || 'application/octet-stream';
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mimeType });

      const formData = new FormData();
      formData.append('chat_id', targetChatId);
      formData.append('caption', captionText);
      formData.append('parse_mode', 'HTML');
      formData.append('document', blob, fileName || 'file');

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.ok && data.result) {
        const fileId = data.result.document?.file_id || data.result.voice?.file_id || data.result.audio?.file_id;
        let telegramFileUrl = '';
        if (fileId) {
          telegramFileUrl = (await getTelegramFileUrl(fileId)) || '';
        }
        return { ok: true, message_id: data.result.message_id, telegramFileUrl };
      } else {
        console.error('Telegram sendDocument failed:', data.description);
      }
    }
  } catch (err) {
    console.error('Error sending document to Telegram:', err);
  }

  return sendTelegramMessage(`${captionText}\n<b>File:</b> 📁 ${fileName}`, targetChatId);
}

/**
 * Send actual voice note/audio to Telegram Bot API and return Telegram Cloud hosted URL
 */
/**
 * Send actual voice note/audio to Telegram Bot API with 3-tier fallback and return Telegram Cloud hosted URL
 */
export async function sendTelegramVoice(
  base64OrUrl: string,
  fileName: string,
  captionText: string,
  chatId?: string
): Promise<{ ok: boolean; message_id?: number; telegramFileUrl?: string }> {
  let targetChatId = chatId || process.env.TELEGRAM_CHAT_ID || cachedChatId;
  if (!targetChatId) targetChatId = await getLatestChatId();

  try {
    if (base64OrUrl.startsWith('data:')) {
      const parts = base64OrUrl.split(',');
      const meta = parts[0];
      const base64Data = parts[1];
      const mimeType = meta.split(';')[0].split(':')[1] || 'audio/webm';
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mimeType });

      // 1. Try sendAudio (Supports webm, mp3, ogg, mp4, wav)
      const audioFormData = new FormData();
      audioFormData.append('chat_id', targetChatId);
      audioFormData.append('caption', captionText);
      audioFormData.append('parse_mode', 'HTML');
      audioFormData.append('audio', blob, fileName || 'voice_note.webm');

      const audioRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`, {
        method: 'POST',
        body: audioFormData,
      });

      const audioData = await audioRes.json();
      if (audioData.ok && audioData.result) {
        const fileId = audioData.result.audio?.file_id || audioData.result.voice?.file_id || audioData.result.document?.file_id;
        let telegramFileUrl = '';
        if (fileId) {
          telegramFileUrl = (await getTelegramFileUrl(fileId)) || '';
        }
        return { ok: true, message_id: audioData.result.message_id, telegramFileUrl };
      } else {
        console.warn('sendAudio failed, attempting sendVoice:', audioData.description);
      }

      // 2. Try sendVoice
      const voiceFormData = new FormData();
      voiceFormData.append('chat_id', targetChatId);
      voiceFormData.append('caption', captionText);
      voiceFormData.append('parse_mode', 'HTML');
      voiceFormData.append('voice', blob, fileName || 'voice_note.webm');

      const voiceRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVoice`, {
        method: 'POST',
        body: voiceFormData,
      });

      const voiceData = await voiceRes.json();
      if (voiceData.ok && voiceData.result) {
        const fileId = voiceData.result.voice?.file_id || voiceData.result.audio?.file_id || voiceData.result.document?.file_id;
        let telegramFileUrl = '';
        if (fileId) {
          telegramFileUrl = (await getTelegramFileUrl(fileId)) || '';
        }
        return { ok: true, message_id: voiceData.result.message_id, telegramFileUrl };
      } else {
        console.warn('sendVoice failed, falling back to sendDocument:', voiceData.description);
      }
    }
  } catch (err) {
    console.error('Error sending voice to Telegram:', err);
  }

  // 3. Fallback to sendDocument
  return sendTelegramDocument(base64OrUrl, fileName, captionText, targetChatId);
}

/**
 * Send media notice/file to Telegram Bot
 */
export async function sendTelegramMediaNotice(
  mediaType: 'image' | 'audio' | 'file',
  mediaUrl: string,
  mediaName: string,
  userNoticeText: string,
  chatId?: string
): Promise<{ ok: boolean; message_id?: number; telegramFileUrl?: string }> {
  if (mediaType === 'image') {
    return sendTelegramPhoto(mediaUrl, mediaName, userNoticeText, chatId);
  } else if (mediaType === 'audio') {
    return sendTelegramVoice(mediaUrl, mediaName, userNoticeText, chatId);
  } else {
    return sendTelegramDocument(mediaUrl, mediaName, userNoticeText, chatId);
  }
}

/**
 * Two-way sync: Pull incoming text & media replies sent in Telegram and sync to MongoDB ChatMessage collection
 */
export async function syncTelegramUpdates(userId: string, ticketId: string): Promise<void> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return;

    let hasNewMessages = false;

    for (const update of data.result) {
      const msg = update.message;
      if (!msg) continue;

      const telegramMsgId = msg.message_id;
      const senderName = msg.from?.first_name || msg.from?.username || 'Telegram Executive';

      // Check if message is already synced
      const existing = await ChatMessage.findOne({ telegramMessageId: telegramMsgId });
      if (existing) continue;

      let msgText = msg.text || msg.caption || '';
      if (msgText.trim().startsWith('/')) continue;

      let msgType: 'text' | 'image' | 'audio' | 'file' = 'text';
      let mediaUrl = '';
      let mediaName = '';

      if (msg.photo && msg.photo.length > 0) {
        const photoItem = msg.photo[msg.photo.length - 1];
        msgType = 'image';
        mediaUrl = (await getTelegramFileUrl(photoItem.file_id)) || '';
        mediaName = 'telegram_photo.jpg';
      } else if (msg.voice) {
        msgType = 'audio';
        mediaUrl = (await getTelegramFileUrl(msg.voice.file_id)) || '';
        mediaName = 'voice_note.ogg';
      } else if (msg.audio) {
        msgType = 'audio';
        mediaUrl = (await getTelegramFileUrl(msg.audio.file_id)) || '';
        mediaName = msg.audio.file_name || 'audio_note.mp3';
      } else if (msg.document) {
        msgType = 'file';
        mediaUrl = (await getTelegramFileUrl(msg.document.file_id)) || '';
        mediaName = msg.document.file_name || 'document.pdf';
      }

      if (msgText || msgType !== 'text') {
        const agentMsgDoc = await ChatMessage.create({
          userId,
          ticketId,
          sender: 'agent',
          senderName: `${senderName} (Telegram)`,
          text: msgText,
          type: msgType,
          mediaUrl,
          mediaName,
          telegramMessageId: telegramMsgId,
          telegramChatId: String(msg.chat.id),
          status: 'read',
        });

        // Mark user's previous messages in ticket as 'read' (double blue ticks)
        await ChatMessage.updateMany(
          { userId, ticketId, sender: 'user' },
          { status: 'read' }
        );

        await SupportTicket.updateOne(
          { ticketId },
          { assignedAgent: `${senderName} (Telegram)`, status: 'assigned' }
        );

        notificationService.broadcastChatMessage(userId, {
          id: agentMsgDoc._id.toString(),
          sender: agentMsgDoc.sender,
          senderName: agentMsgDoc.senderName,
          text: agentMsgDoc.text,
          type: agentMsgDoc.type,
          mediaUrl: agentMsgDoc.mediaUrl,
          mediaName: agentMsgDoc.mediaName,
          status: 'read',
          createdAt: agentMsgDoc.createdAt.toISOString(),
        });
      }
    }
  } catch (err) {
    // Silent catch for network/timeout errors
  }
}

/**
 * Intelligent Assistant response generator for Expense Tracker queries
 */
export function generateBotResponse(userMessage: string, userName?: string, mediaType?: string): string {
  const lower = userMessage.toLowerCase().trim();
  const name = userName || 'there';

  if (mediaType === 'image') {
    return `🖼️ Thank you for uploading the photo receipt! I've attached it to your support ticket and delivered it directly to our Telegram support team.`;
  }
  if (mediaType === 'audio') {
    return `🎙️ Voice note received! I've logged your audio message to support desk (@ExpenseAssistant_bot).`;
  }
  if (mediaType === 'file') {
    return `📁 Document received! We have safely attached your file to ticket details.`;
  }

  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('start')) {
    return `Hello ${name}! 👋 Welcome to Expense Desk Support. How can I assist you with your finances today?`;
  }

  if (lower.includes('add') || lower.includes('transaction') || lower.includes('expense') || lower.includes('income')) {
    return `➕ **Adding Transactions**:\nClick the "+" button at the bottom navigation bar to record an Expense, Income, or Transfer. You can assign categories, attach receipt notes, and organize into monthly notebooks!`;
  }

  if (lower.includes('split') || lower.includes('group') || lower.includes('bill') || lower.includes('share')) {
    return `👥 **Split Transactions & Books**:\nNavigate to the Management tab to view your Split Books. You can add split users, calculate balances, and track who owes what seamlessly!`;
  }

  if (lower.includes('export') || lower.includes('report') || lower.includes('download') || lower.includes('pdf') || lower.includes('excel') || lower.includes('csv')) {
    return `📄 **Exporting Reports**:\nGo to the Transactions page and click the "Export Report" button in the upper header. Select your date range, custom filters, and choose CSV, Excel, or PDF format to download!`;
  }

  if (lower.includes('security') || lower.includes('session') || lower.includes('device') || lower.includes('logout') || lower.includes('password')) {
    return `🔒 **Security & Sessions**:\nHead to Profile > Session Management to inspect all active devices signed in to your account. You can instantly revoke single devices or sign out of all other sessions with one click!`;
  }

  if (lower.includes('agent') || lower.includes('human') || lower.includes('contact') || lower.includes('help') || lower.includes('support')) {
    return `📬 **Live Agent Dispatch**:\nYour message has been dispatched to our support desk (@ExpenseAssistant_bot). A support representative will review your query shortly! You can also chat directly on Telegram at t.me/ExpenseAssistant_bot.`;
  }

  return `Thanks for reaching out! 🤖 I've recorded your query:\n"${userMessage}"\n\nOur Telegram Bot (@ExpenseAssistant_bot) is actively processing your request. You can also ask me about adding transactions, split bills, exporting reports, or account security!`;
}
