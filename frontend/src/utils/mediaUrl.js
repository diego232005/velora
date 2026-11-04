import { API_URL } from '../api/client';

/** Resuelve rutas relativas del API (/uploads/..., /api/drive/file/...). */
export function mediaUrl(url) {
  if (!url) return null;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const base = String(API_URL || '').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}
