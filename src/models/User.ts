import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  username?: string;
  memberId?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  currency: string;
  theme: 'light' | 'dark';
  language: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    memberId: { type: String, unique: true, sparse: true, trim: true, index: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    language: { type: String, default: 'en' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

export default models.User || model<IUser>('User', UserSchema);
