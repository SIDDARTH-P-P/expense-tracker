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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const json = await res.json().catch(() => ({}));

  // Session expired or unauthorized → redirect to login
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Avoid redirect loop on the login page itself
      if (!currentPath.startsWith('/login')) {
        window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}&reason=session_expired`);
      }
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
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
