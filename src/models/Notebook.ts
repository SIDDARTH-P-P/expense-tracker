import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface INotebook extends Document {
  recordId?: string;
  userId: Types.ObjectId;
  name: string;
  month?: number; // 0-11
  year?: number;  // e.g. 2026
  isAutoMonthly: boolean;
  isStarred?: boolean;
  isPinned?: boolean;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotebookSchema = new Schema<INotebook>(
  {
    recordId: { type: String, trim: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    month: { type: Number, min: 0, max: 11 },
    year: { type: Number },
    isAutoMonthly: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    color: { type: String, default: '#6366F1' },
    icon: { type: String, default: 'FiBook' },
  },
  { timestamps: true }
);

NotebookSchema.index({ userId: 1, name: 1 }, { unique: true });
NotebookSchema.index({ recordId: 1 }, { unique: true, sparse: true });

if (process.env.NODE_ENV === 'development' && models.Notebook) {
  delete (models as any).Notebook;
}

export default models.Notebook || model<INotebook>('Notebook', NotebookSchema);
