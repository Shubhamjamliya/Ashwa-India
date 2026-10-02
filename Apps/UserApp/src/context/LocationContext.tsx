import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentPosition } from '../services/location';
import { reverseGeocode } from '../services/geocoding';

const MANUAL_LOCATION_KEY = 'ashwa_user_manual_location';

export type CurrentLocation = {
  lat: number;
  lng: number;
  label: string;
  /** 'manual' = user picked it via Change Location; 'device' = auto-detected GPS. */
  source: 'manual' | 'device';
};

type Status = 'loading' | 'needs-location' | 'ready';

type LocationContextValue = {
  status: Status;
  location: CurrentLocation | null;
  error: string | null;
  gpsDisabled: boolean;
  /** Re-runs device GPS detection, clearing any manual override. */
  useDeviceLocation: () => void;
  /** Sets an explicit location the user picked (e.g. via search). Persisted. */
  setManualLocation: (loc: { lat: number; lng: number; label: string }) => void;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

// Matches the standard W3C/Android geolocation error codes: 1 = permission
// denied, 2 = position unavailable (GPS off).
const POSITION_UNAVAILABLE = 2;

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsDisabled, setGpsDisabled] = useState(false);

  const detectDeviceLocation = useCallback(() => {
    setStatus('loading');
    setError(null);
    setGpsDisabled(false);

    getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const place = await reverseGeocode(latitude, longitude).catch(() => null);
        const label = place?.city
          ? `${place.city}${place.state ? `, ${place.state}` : ''}`
          : 'Current Location';
        setLocation({ lat: latitude, lng: longitude, label, source: 'device' });
        setStatus('ready');
      },
      err => {
        if (err.code === POSITION_UNAVAILABLE) {
          setGpsDisabled(true);
          setError('Your device location (GPS) is turned off');
        } else {
          setError(err.message || 'Could not get your location');
        }
        setStatus('needs-location');
      },
      // High accuracy forces raw GPS, which can take well over a minute to
      // get a first fix indoors — city-level precision is enough here.
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(MANUAL_LOCATION_KEY).then(raw => {
      if (raw) {
        setLocation({ ...JSON.parse(raw), source: 'manual' });
        setStatus('ready');
      } else {
        detectDeviceLocation();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useDeviceLocation = useCallback(() => {
    AsyncStorage.removeItem(MANUAL_LOCATION_KEY).catch(() => {});
    detectDeviceLocation();
  }, [detectDeviceLocation]);

  const setManualLocation = useCallback((loc: { lat: number; lng: number; label: string }) => {
    setLocation({ ...loc, source: 'manual' });
    setStatus('ready');
    setError(null);
    AsyncStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify(loc)).catch(() => {});
  }, []);

  return (
    <LocationContext.Provider
      value={{ status, location, error, gpsDisabled, useDeviceLocation, setManualLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}
