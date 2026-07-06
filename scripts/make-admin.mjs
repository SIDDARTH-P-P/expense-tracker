/**
 * Quick script to promote a user to admin by email.
 * Usage: node scripts/make-admin.mjs your@email.com
 *
 * Run from the expense-tracker directory with MongoDB running.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);

const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  role: { type: String, default: 'user' }
}, { strict: false }));

const result = await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  { $set: { role: 'admin' } },
  { new: true }
);

if (!result) {
  console.error(`❌ No user found with email: ${email}`);
} else {
  console.log(`✅ User ${result.email} is now an admin.`);
}

await mongoose.disconnect();
