import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  ticketId?: string;
  sender: 'user' | 'bot' | 'agent';
  senderName?: string;
  text: string;
  type: 'text' | 'image' | 'audio' | 'file' | 'refund_widget' | 'options_widget';
  mediaUrl?: string;
  mediaName?: string;
  widgetData?: Schema.Types.Mixed;
  telegramMessageId?: number;
  telegramChatId?: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticketId: { type: String, index: true },
    sender: { type: String, enum: ['user', 'bot', 'agent'], required: true },
    senderName: { type: String, default: 'Expense Desk' },
    text: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'file', 'refund_widget', 'options_widget'],
      default: 'text',
    },
    mediaUrl: { type: String, default: '' },
    mediaName: { type: String, default: '' },
    widgetData: { type: Schema.Types.Mixed },
    telegramMessageId: { type: Number },
    telegramChatId: { type: String },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'read',
    },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === 'development' && models.ChatMessage) {
  delete (models as any).ChatMessage;
}

export default models.ChatMessage || model<IChatMessage>('ChatMessage', ChatMessageSchema);
