import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { apiUpload } from './api';

// Photos are scaled down before upload; the server accepts PNG, JPG or WEBP up to 5 MB.
const OPTIONS = { mediaType: 'photo', quality: 0.8, maxWidth: 1600, maxHeight: 1600 } as const;

type Picked = { uri: string; name: string; type: string };

function firstAsset(res: ImagePickerResponse): Picked[] {
  if (res.didCancel) return [];
  if (res.errorCode) {
    throw new Error(res.errorCode === 'permission' ? 'Allow camera and photo access to add a photo' : res.errorMessage || 'Could not open the camera');
  }
  return (res.assets || [])
    .filter(a => a.uri)
    .map(a => ({ uri: a.uri!, name: a.fileName || `photo-${Date.now()}.jpg`, type: a.type || 'image/jpeg' }));
}

// Lets the user take a photo or choose from the gallery (like the web's file input on a phone).
// Resolves the picked photos, or none if the user backed out.
export function choosePhotos({ multiple = false }: { multiple?: boolean } = {}): Promise<Picked[]> {
  return new Promise((resolve, reject) => {
    const run = (fn: () => Promise<ImagePickerResponse>) => () =>
      fn()
        .then(res => resolve(firstAsset(res)))
        .catch(reject);
    Alert.alert('Add photo', undefined, [
      { text: 'Take photo', onPress: run(() => launchCamera(OPTIONS)) },
      {
        text: 'Choose from gallery',
        onPress: run(() => launchImageLibrary({ ...OPTIONS, selectionLimit: multiple ? 0 : 1 })),
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve([]) },
    ]);
  });
}

// Uploads one photo and returns its stored url.
export async function uploadPhoto(photo: Picked): Promise<string> {
  const form = new FormData();
  form.append('file', photo as any);
  const res = await apiUpload<{ url: string }>('/uploads/image', form);
  return res.url;
}
