import { connectDB } from '@/lib/db';
import Counter, { type RecordIdPrefix } from '@/models/Counter';

function pad(value: number, length: number) {
  return String(value).padStart(length, '0');
}

export async function generateRecordId(prefix: RecordIdPrefix, now = new Date()) {
  await connectDB();

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const counterId = `${prefix}-${year}-${pad(month, 2)}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId, prefix, year, month },
    {
      $inc: { sequence: 1 },
      $set: { updatedAt: new Date() },
      $setOnInsert: { _id: counterId, prefix, year, month },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<{ sequence: number }>();

  if (!counter) {
    throw new Error(`Could not generate record ID for ${prefix}.`);
  }

  return `${prefix}-${year}-${pad(month, 2)}-${pad(counter.sequence, 4)}`;
}

export type { RecordIdPrefix };
