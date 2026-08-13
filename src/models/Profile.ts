import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
  username: string;
  memberId: string;
  avatar?: string;
  phone?: string;
  address?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    memberId: { type: String, required: true, unique: true, trim: true, index: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    language: { type: String, default: 'en' },
  },
  { timestamps: true }
);

export default models.Profile || model<IProfile>('Profile', ProfileSchema);
