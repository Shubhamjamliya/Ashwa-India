import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { API_BASE_URL } from './config';
import { getSession } from './storage';
import { apiUpload, refreshSession } from './api';
import type { PickedFile } from './fileTypes';

export type { PickedFile } from './fileTypes';

// Downloads a PDF the signed-in user may read (an order invoice, say) and opens it in the
// phone's PDF viewer, which can print, share or save it. Android also keeps a copy in Downloads.
export async function openAuthorizedPdf(
  path: string,
  fileName: string,
): Promise<{ savedToDownloads: boolean }> {
  const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;
  const download = (token: string | null) =>
    ReactNativeBlobUtil.config({ path: dest, overwrite: true }).fetch(
      'GET',
      `${API_BASE_URL}${path}`,
      token ? { Authorization: `Bearer ${token}` } : {},
    );

  const { accessToken } = await getSession();
  let res = await download(accessToken);
  if (res.info().status === 401) res = await download(await refreshSession());

  const status = res.info().status;
  if (status < 200 || status >= 300) {
    await ReactNativeBlobUtil.fs.unlink(dest).catch(() => {});
    throw new Error('Could not download the file');
  }

  let savedToDownloads = false;
  if (Platform.OS === 'android') {
    try {
      await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        { name: fileName, parentFolder: '', mimeType: 'application/pdf' } as any,
        'Download',
        dest,
      );
      savedToDownloads = true;
    } catch {
      // Android 9 and older have no shared Downloads collection; the viewer below still opens it.
    }
    await ReactNativeBlobUtil.android.actionViewIntent(dest, 'application/pdf');
  } else {
    await ReactNativeBlobUtil.ios.openDocument(dest);
  }
  return { savedToDownloads };
}

// Opens the system file picker for one PDF. Resolves null when the user backs out.
export async function pickPdf(): Promise<PickedFile | null> {
  try {
    const [file] = await pick({ type: [types.pdf] });
    if (!file.hasRequestedType) throw new Error('Choose a PDF file');
    const name = file.name ?? 'document.pdf';
    // A plain file:// copy uploads the same way on both platforms (Android hands out content:// uris).
    const [copy] = await keepLocalCopy({
      files: [{ uri: file.uri, fileName: name }],
      destination: 'cachesDirectory',
    });
    return {
      uri: copy.status === 'success' ? copy.localUri : file.uri,
      name,
      type: file.type ?? 'application/pdf',
      size: file.size,
    };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return null;
    throw err;
  }
}

// Sends a picked file as multipart form data under `field` (the backend reads 'file').
export function uploadFile<T = any>(path: string, file: PickedFile, field = 'file'): Promise<T> {
  const form = new FormData();
  form.append(field, { uri: file.uri, name: file.name, type: file.type } as any);
  return apiUpload<T>(path, form);
}
