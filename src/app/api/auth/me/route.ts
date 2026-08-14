import { getCurrentUser } from '@/lib/auth';
import { userRepository } from '@/repositories/user.repository';
import { profileRepository } from '@/repositories/profile.repository';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { auditService, AuditChangeItem } from '@/services/audit.service';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return apiError('Unauthorized.', 401);

  const user = await userRepository.findById(session.userId);
  if (!user) return apiError('User not found.', 404);

  // Automatically fetch or create the corresponding document in the Profile collection
  const profile = await profileRepository.getOrCreateProfile(session.userId);

  return apiSuccess({
    id: String(user._id),
    name: profile.name || user.name,
    email: profile.email || user.email,
    username: profile.username,
    memberId: profile.memberId,
    avatar: profile.avatar || user.avatar || '',
    phone: profile.phone || user.phone || '',
    address: profile.address || user.address || '',
    currency: user.currency || 'INR',
    theme: user.theme || 'dark',
    language: profile.language || user.language || 'en',
    role: user.role ?? 'user',
    createdAt: profile.createdAt || user.createdAt,
  });
}

export async function PATCH(req: Request) {
  const session = await getCurrentUser();
  if (!session) return apiError('Unauthorized.', 401);

  try {
    const body = await req.json();
    const allowedUpdates = ['name', 'email', 'username', 'avatar', 'phone', 'address', 'language'];
    const updateData: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    // Fetch previous profile before updating
    const existingProfile = await profileRepository.getOrCreateProfile(session.userId);

    const labels: Record<string, string> = {
      name: 'Full Name',
      email: 'Email',
      username: 'Username',
      phone: 'Phone Number',
      address: 'Address',
      avatar: 'Profile Picture',
      language: 'Language',
    };

    const changes: AuditChangeItem[] = [];
    const existingProfileObj = existingProfile ? existingProfile.toObject() : {};
    for (const key of allowedUpdates) {
      const prevVal = (existingProfileObj as any)[key];
      if (updateData[key] !== undefined && updateData[key] !== prevVal) {
        const oldVal = key === 'avatar' ? (prevVal ? 'Photo set' : 'None') : (prevVal || 'None');
        const newVal = key === 'avatar' ? (updateData[key] ? 'Photo updated' : 'Removed') : (updateData[key] || 'None');
        changes.push({
          field: key,
          label: labels[key] || key,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }

    const updatedProfile = await profileRepository.updateByUserId(session.userId, updateData);
    const user = await userRepository.findById(session.userId);

    // Record audit log entry
    if (changes.length > 0) {
      await auditService.logProfileUpdate(session.userId, changes, req);
    }

    return apiSuccess({
      id: String(session.userId),
      name: updatedProfile?.name || user?.name,
      email: updatedProfile?.email || user?.email,
      username: updatedProfile?.username || user?.username,
      memberId: updatedProfile?.memberId || user?.memberId,
      avatar: updatedProfile?.avatar || user?.avatar || '',
      phone: updatedProfile?.phone || user?.phone || '',
      address: updatedProfile?.address || user?.address || '',
      currency: user?.currency || 'INR',
      theme: user?.theme || 'dark',
      language: updatedProfile?.language || user?.language || 'en',
      role: user?.role ?? 'user',
    });
  } catch (error: any) {
    return apiError(error?.message || 'Failed to update profile.', 500);
  }
}
