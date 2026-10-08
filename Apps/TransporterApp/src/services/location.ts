import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type LatLng = { lat: number; lng: number };

if (Platform.OS === 'android') {
  // 'auto' prefers Google Play Services' fused provider (fast indoors) and falls back to raw GPS.
  Geolocation.setRNConfiguration({ skipPermissionRequests: false, locationProvider: 'auto' });
}

// Asks for location access once. Resolves false when the user says no.
export async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getCurrentLocation(): Promise<LatLng> {
  if (!(await ensureLocationPermission())) throw new Error('Allow location access to go online');
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Allow location access to go online')),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}

// Follows the device position; returns a function that stops watching.
export function watchLocation(
  onPosition: (point: LatLng) => void,
  onError: () => void,
  options: { maximumAge?: number } = {},
): () => void {
  const id = Geolocation.watchPosition(
    pos => onPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => onError(),
    { enableHighAccuracy: true, maximumAge: options.maximumAge ?? 10000, distanceFilter: 10 },
  );
  return () => Geolocation.clearWatch(id);
}
