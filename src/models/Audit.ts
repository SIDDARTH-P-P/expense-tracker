import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface IAudit extends Document {
  userId: Types.ObjectId;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
}

const AuditSchema = new Schema<IAudit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default models.Audit || model<IAudit>('Audit', AuditSchema);
