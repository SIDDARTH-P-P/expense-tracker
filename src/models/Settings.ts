import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface ISettings extends Document {
  userId: Types.ObjectId;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    weeklySummary: boolean;
  };
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currency: { type: String, default: 'USD' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default models.Settings || model<ISettings>('Settings', SettingsSchema);
