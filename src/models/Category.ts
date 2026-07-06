import { Schema, model, models, type Document, type Types } from 'mongoose';

export interface ICategory extends Document {
  userId: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    icon: { type: String, required: true, default: 'FiTag' },
    color: { type: String, required: true, default: '#2DD4BF' },
    type: { type: String, enum: ['income', 'expense', 'both'], default: 'expense' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default models.Category || model<ICategory>('Category', CategorySchema);
