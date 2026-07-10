import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface ICategory extends Document {
  recordId?: string;
  userId: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    recordId: { type: String, trim: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    icon: { type: String, required: true, default: 'FiTag' },
    color: { type: String, required: true, default: '#2DD4BF' },
    type: { type: String, enum: ['income', 'expense', 'both'], default: 'expense' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });
CategorySchema.index({ recordId: 1 }, { unique: true, sparse: true });

export default models.Category || model<ICategory>('Category', CategorySchema);
