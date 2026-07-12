import { withAuth } from '@/middlewares/with-auth';
import { notificationService } from '@/services/notification.service';

export const GET = withAuth(async (req, user) => {
  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      cleanup = notificationService.registerClient(user.userId, controller);
    },
    cancel() {
      cleanup();
    }
  });

  // Handle client aborting the request/connection
  req.signal.addEventListener('abort', () => {
    cleanup();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
});
