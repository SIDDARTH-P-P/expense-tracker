import { Schema, model, models, type Document, type Types } from 'mongoose';

export type SplitMode = 'equal' | 'custom';

export interface ISplitMember {
  userId: Types.ObjectId;
  shareAmount: number;
  paid: boolean;
}

export interface ISplit extends Document {
  recordId: string;
  userId: Types.ObjectId;
  title: string;
  amount: number;
  paidBy: Types.ObjectId;
  splitMode: SplitMode;
  members: ISplitMember[];
  status: 'Pending' | 'Partially Paid' | 'Completed';
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SplitMemberSchema = new Schema<ISplitMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'SplitUser', required: true },
    shareAmount: { type: Number, required: true, min: 0 },
    paid: { type: Boolean, default: false },
  },
  { _id: false }
);

const SplitSchema = new Schema<ISplit>(
  {
    recordId: { type: String, required: true, trim: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    paidBy: { type: Schema.Types.ObjectId, ref: 'SplitUser', required: true },
    splitMode: { type: String, enum: ['equal', 'custom'], default: 'equal' },
    members: { type: [SplitMemberSchema], default: [] },
    status: { type: String, enum: ['Pending', 'Partially Paid', 'Completed'], default: 'Pending' },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SplitSchema.index({ recordId: 1 }, { unique: true });
SplitSchema.index({ userId: 1, createdAt: -1 });
SplitSchema.index({ userId: 1, title: 1 });

export default models.Split || model<ISplit>('Split', SplitSchema);
