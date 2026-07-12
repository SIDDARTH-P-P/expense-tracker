import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface ITransaction extends Document {
  recordId?: string;
  userId: Types.ObjectId;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: Types.ObjectId;
  subCategory?: string | null;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  splitId?: Types.ObjectId | null;
  splitRecordId?: string | null;
  splitMembersCount?: number | null;
  createdFrom?: string | null;
  createdBy?: Types.ObjectId | null;
  transactionType?: 'Split Expense' | 'Split Income' | 'Split Settlement' | null;
  status: 'Paid' | 'Pending';
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    recordId: { type: String, trim: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ['income', 'expense'], required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategory: { type: String, default: null },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
      default: 'card',
    },
    date: { type: Date, required: true, default: Date.now, index: true },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    splitId: { type: Schema.Types.ObjectId, ref: 'Split', default: null, index: true },
    splitRecordId: { type: String, default: null, index: true },
    splitMembersCount: { type: Number, default: null },
    createdFrom: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    transactionType: {
      type: String,
      enum: ['Split Expense', 'Split Income', 'Split Settlement', null],
      default: null,
    },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ recordId: 1 }, { unique: true, sparse: true });

export default models.Transaction || model<ITransaction>('Transaction', TransactionSchema);
