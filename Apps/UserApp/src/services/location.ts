import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

type Success = (position: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (error: { message?: string }) => void;
type Options = { enableHighAccuracy?: boolean; timeout?: number };

export function getCurrentPosition(onSuccess: Success, onError: Failure, options?: Options) {
  if (Platform.OS === 'web') {
    const webGeolocation = (globalThis as any)?.navigator?.geolocation;
    if (!webGeolocation) {
      onError({ message: 'Geolocation is not supported in this browser' });
      return;
    }
    webGeolocation.getCurrentPosition(
      (position: any) =>
        onSuccess({ coords: { latitude: position.coords.latitude, longitude: position.coords.longitude } }),
      (error: any) => onError({ message: error.message }),
      options,
    );
    return;
  }
  Geolocation.getCurrentPosition(onSuccess, onError, options);
}
