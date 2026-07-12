import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface INotification extends Document {
  recordId: string;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'Split Created' | 'Split Paid' | 'Split Reminder' | 'Expense' | 'Income' | 'System';
  relatedId?: string | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recordId: { type: String, required: true, trim: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Split Created', 'Split Paid', 'Split Reminder', 'Expense', 'Income', 'System'],
      required: true,
    },
    relatedId: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recordId: 1 }, { unique: true });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default models.Notification || model<INotification>('Notification', NotificationSchema);
