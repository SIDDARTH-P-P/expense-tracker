import { Schema, model, models, type Document } from 'mongoose';

export type RecordIdPrefix = 'EXP' | 'INC' | 'CAT' | 'USR' | 'SPL';

export interface ICounter extends Document<string> {
  prefix: RecordIdPrefix;
  year: number;
  month: number;
  sequence: number;
  updatedAt: Date;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    prefix: { type: String, enum: ['EXP', 'INC', 'CAT', 'USR', 'SPL'], required: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    sequence: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false }
);

CounterSchema.index({ prefix: 1, year: 1, month: 1 }, { unique: true });

export default models.Counter || model<ICounter>('Counter', CounterSchema);
