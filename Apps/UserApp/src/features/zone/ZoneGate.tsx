import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getCurrentPosition } from '../../services/location';
import { checkZone } from '../../services/zones';
import { colors } from '../../theme/colors';
import { ComingSoonScreen } from './screens/ComingSoonScreen';
import { LocationRequiredScreen } from './screens/LocationRequiredScreen';

type Status = 'checking' | 'needs-location' | 'in-zone' | 'out-of-zone';

export function ZoneGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const runCheck = useCallback(() => {
    setStatus('checking');
    setLocationError(null);
    getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await checkZone(latitude, longitude);
          setZoneName(result.zone?.name ?? null);
          setStatus(result.inZone ? 'in-zone' : 'out-of-zone');
        } catch (e) {
          // If the zone check itself fails (network blip, backend down), don't
          // lock users out of an app they could otherwise use — let them in.
          setStatus('in-zone');
        }
      },
      error => {
        setLocationError(error.message || 'Could not get your location');
        setStatus('needs-location');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (status === 'needs-location') {
    return <LocationRequiredScreen onEnableLocation={runCheck} error={locationError} />;
  }

  if (status === 'out-of-zone') {
    return <ComingSoonScreen zoneLabel={zoneName} onRetry={runCheck} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
