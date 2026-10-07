// Browser preview build: the native file libraries have no web implementation, so these use the
// browser's own download and file input instead (same behaviour as the web panel).
import { API_BASE_URL } from './config';
import { getSession } from './storage';
import { apiUpload, refreshSession } from './api';
import type { PickedFile } from './fileTypes';

export type { PickedFile } from './fileTypes';

const browser = globalThis as any;

export async function openAuthorizedPdf(path: string, _fileName: string): Promise<{ savedToDownloads: boolean }> {
  const download = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  const { accessToken } = await getSession();
  let res = await download(accessToken);
  if (res.status === 401) res = await download(await refreshSession());
  if (!res.ok) throw new Error('Could not download the file');

  const url = browser.URL.createObjectURL(await res.blob());
  browser.open(url, '_blank');
  setTimeout(() => browser.URL.revokeObjectURL(url), 60000);
  return { savedToDownloads: false };
}

export function pickPdf(): Promise<PickedFile | null> {
  return new Promise(resolve => {
    const input = browser.document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ? { uri: '', name: file.name, type: file.type || 'application/pdf', size: file.size, blob: file } : null);
    };
    input.click();
  });
}

export function uploadFile<T = any>(path: string, file: PickedFile, field = 'file'): Promise<T> {
  const form: any = new FormData();
  form.append(field, file.blob, file.name);
  return apiUpload<T>(path, form);
}
