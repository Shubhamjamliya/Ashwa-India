import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

type Success = (position: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (error: { code?: number; message?: string }) => void;
type Options = { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number };

if (Platform.OS === 'android') {
  // 'auto' prefers Google Play Services' fused provider (WiFi/cell/GPS fused —
  // fast indoors) and falls back to raw GPS only if Play Services is missing.
  // Without this, Android defaults to plain GPS, which can take well over a
  // minute to get a first fix indoors and was causing location timeouts.
  Geolocation.setRNConfiguration({ skipPermissionRequests: false, locationProvider: 'auto' });
}

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
      (error: any) => onError({ code: error.code, message: error.message }),
      options,
    );
    return;
  }
  Geolocation.getCurrentPosition(onSuccess, onError, options);
}
