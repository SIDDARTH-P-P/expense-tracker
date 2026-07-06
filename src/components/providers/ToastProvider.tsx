'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3200,
        className: '!rounded-2xl !bg-surface !text-foreground !border !border-border !shadow-soft',
        success: { iconTheme: { primary: 'hsl(152 60% 42%)', secondary: 'white' } },
        error: { iconTheme: { primary: 'hsl(350 75% 56%)', secondary: 'white' } },
      }}
    />
  );
}
