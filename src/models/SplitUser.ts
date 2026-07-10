import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface ISplitUser extends Document {
  recordId: string;
  userId: Types.ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const SplitUserSchema = new Schema<ISplitUser>(
  {
    recordId: { type: String, required: true, trim: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
  },
  { timestamps: true }
);

SplitUserSchema.index({ recordId: 1 }, { unique: true });
SplitUserSchema.index({ userId: 1, email: 1 }, { unique: true });

export default models.SplitUser || model<ISplitUser>('SplitUser', SplitUserSchema);
