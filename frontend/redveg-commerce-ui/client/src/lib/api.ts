const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export function apiUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL is not configured');
  }
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

/**
 * Shared browser API client. Admin endpoints use the HTTP-only session cookie;
 * public endpoints also work with credentials included when CORS is configured.
 */
export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(apiUrl(path), {
    ...init,
    credentials: init.credentials ?? 'include',
  });
}

export function normalizeCategorySlug(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-and-/g, '-');
}

export function unwrapApiData<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return ((payload as { data?: T }).data ?? fallback) as T;
  }
  return (payload as T) ?? fallback;
}
