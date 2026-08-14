import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface IAuditDevice {
  browser?: string;
  os?: string;
  deviceType?: string;
  deviceName?: string;
  ip?: string;
  userAgent?: string;
}

export interface IAudit extends Document {
  userId: Types.ObjectId;
  action: string;
  category?: string;
  details: Record<string, any>;
  device?: IAuditDevice;
  timestamp: Date;
}

const AuditSchema = new Schema<IAudit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    category: { type: String, default: 'GENERAL', index: true },
    details: { type: Schema.Types.Mixed, default: {} },
    device: {
      browser: String,
      os: String,
      deviceType: String,
      deviceName: String,
      ip: String,
      userAgent: String,
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default models.Audit || model<IAudit>('Audit', AuditSchema);
