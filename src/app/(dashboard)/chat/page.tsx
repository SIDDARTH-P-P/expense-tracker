'use client';

import { LiveChatModal } from '@/components/chat/LiveChatModal';
import { useAuthStore } from '@/store/auth.store';

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="w-full h-[100dvh] bg-background flex flex-col justify-center items-center p-0 overflow-hidden">
      <LiveChatModal
        isPage={true}
        user={
          user
            ? {
                name: user.name,
                email: user.email,
                username: user.username,
                memberId: user.memberId,
                avatar: user.avatar,
              }
            : undefined
        }
      />
    </div>
  );
}
