import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;       // unique token stored in et_session_id cookie
  deviceName: string;      // e.g. "Chrome on Windows"
  os: string;              // e.g. "Windows 11"
  browser: string;         // e.g. "Chrome 125"
  ip: string;
  location: string;        // "City, Country" from IP lookup
  loginAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    deviceName: { type: String, default: 'Unknown device' },
    os: { type: String, default: 'Unknown OS' },
    browser: { type: String, default: 'Unknown browser' },
    ip: { type: String, default: '' },
    location: { type: String, default: 'Unknown location' },
    loginAt: { type: Date, default: () => new Date() },
    lastSeenAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
  },
  { timestamps: false }
);

export default models.Session || model<ISession>('Session', SessionSchema);
