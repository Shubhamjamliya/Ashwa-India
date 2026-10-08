import { errorCodes, isErrorWithCode, keepLocalCopy, pick, types } from '@react-native-documents/picker';
import { apiUpload } from './api';

export type PickedFile = { uri: string; name: string; type: string; size: number | null };

// Opens the system file picker for one PDF. Resolves null when the user backs out.
export async function pickPdf(): Promise<PickedFile | null> {
  try {
    const [file] = await pick({ type: [types.pdf] });
    if (!file.hasRequestedType) throw new Error('Choose a PDF file');
    const name = file.name ?? 'document.pdf';
    // A plain file:// copy uploads the same way on both platforms (Android hands out content:// uris).
    const [copy] = await keepLocalCopy({ files: [{ uri: file.uri, fileName: name }], destination: 'cachesDirectory' });
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

// Sends a picked file as multipart form data under `file`.
export function uploadFile<T = any>(path: string, file: PickedFile): Promise<T> {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  return apiUpload<T>(path, form);
}
