import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // Expire document after 10 minutes
  },
  { timestamps: false }
);

export default models.Otp || model<IOtp>('Otp', OtpSchema);
