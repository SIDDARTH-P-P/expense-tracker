import User from '@/models/User';
import Profile from '@/models/Profile';
import { connectDB } from '@/lib/db';

export async function generateUniqueUsername(name: string, email: string): Promise<string> {
  await connectDB();
  const base = (name || email.split('@')[0] || 'siddarth')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15) || 'siddarth';

  let username = base;
  let counter = 1;

  while ((await Profile.findOne({ username })) || (await User.findOne({ username }))) {
    username = `${base}${counter}`;
    counter++;
  }

  return username;
}

export async function generateUniqueMemberId(): Promise<string> {
  await connectDB();
  let memberId = '';
  let exists = true;

  while (exists) {
    // Generate an 11-digit numeric ID starting with 1920...
    const randomPart = Math.floor(100050000 + Math.random() * 899949999).toString();
    memberId = `192${randomPart}`;
    const foundProfile = await Profile.findOne({ memberId });
    const foundUser = await User.findOne({ memberId });
    if (!foundProfile && !foundUser) {
      exists = false;
    }
  }

  return memberId;
}
