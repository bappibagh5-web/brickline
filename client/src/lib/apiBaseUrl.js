export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;

  if (configured && String(configured).trim()) {
    return String(configured).trim().replace(/\/+$/, '');
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }

  // In production, force explicit config instead of accidentally calling localhost.
  throw new Error('Missing VITE_API_BASE_URL for production build.');
}
