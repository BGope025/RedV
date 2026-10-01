const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function apiUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL is not configured');
  }
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}
