import { API_BASE_URL } from './config';

const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function getMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
