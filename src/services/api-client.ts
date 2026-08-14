/**
 * Thin fetch wrapper shared by every React Query hook. Centralizes the
 * `/api` base path, credentials, and error unwrapping so components never
 * touch `fetch` directly.
 */
export class ApiClientError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

let _isRedirectingToLogin = false;

function handleSessionExpired() {
  if (_isRedirectingToLogin) return;

  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/login')) return;

  _isRedirectingToLogin = true;

  import('react-hot-toast')
    .then(({ default: toast }) => {
      toast.error('Session expired. Please log in again.', {
        duration: 3000,
        id: 'session-expired',
      });
    })
    .catch(() => {});

  setTimeout(() => {
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&reason=session_expired`;
  }, 400);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const json = await res.json().catch(() => ({}));

  // Session expired or unauthorized → show toast & redirect immediately
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>).__IS_LOGGING_OUT) {
      handleSessionExpired();
    }
  }

  if (!res.ok || !json.success) {
    throw new ApiClientError(json.error ?? 'Something went wrong.', res.status, json.details);
  }

  return json.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};
