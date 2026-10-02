import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocationContext } from '../../context/LocationContext';
import { checkZone } from '../../services/zones';
import { colors } from '../../theme/colors';
import { ComingSoonScreen } from './screens/ComingSoonScreen';
import { LocationRequiredScreen } from './screens/LocationRequiredScreen';
import { ChangeLocationScreen } from './screens/ChangeLocationScreen';

type ZoneStatus = 'checking' | 'in-zone' | 'out-of-zone';

export function ZoneGate({ children }: { children: React.ReactNode }) {
  const { status: locationStatus, location, error, gpsDisabled, useDeviceLocation, setManualLocation } =
    useLocationContext();
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>('checking');
  const [zoneName, setZoneName] = useState<string | null>(null);
  // Lets a user stuck on "needs location" or "out of zone" pick a location
  // manually — those screens render outside any navigator, so this is a
  // local overlay rather than a pushed route (see ChangeLocationRoute for
  // the normal in-app version, reachable by tapping the location on Home).
  const [showChangeLocation, setShowChangeLocation] = useState(false);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setZoneStatus('checking');

    checkZone(location.lat, location.lng)
      .then(result => {
        if (cancelled) return;
        setZoneName(result.zone?.name ?? null);
        setZoneStatus(result.inZone ? 'in-zone' : 'out-of-zone');
      })
      .catch(() => {
        // If the zone check itself fails (network blip, backend down), don't
        // lock users out of an app they could otherwise use — let them in.
        if (!cancelled) setZoneStatus('in-zone');
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

  if (showChangeLocation) {
    return (
      <ChangeLocationScreen
        onClose={() => setShowChangeLocation(false)}
        onSelect={loc => {
          setManualLocation(loc);
          setShowChangeLocation(false);
        }}
        onUseCurrentLocation={() => {
          useDeviceLocation();
          setShowChangeLocation(false);
        }}
      />
    );
  }

  if (locationStatus === 'loading' || (locationStatus === 'ready' && zoneStatus === 'checking')) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (locationStatus === 'needs-location') {
    return (
      <LocationRequiredScreen
        onEnableLocation={useDeviceLocation}
        onChangeLocation={() => setShowChangeLocation(true)}
        error={error}
        gpsDisabled={gpsDisabled}
      />
    );
  }

  if (zoneStatus === 'out-of-zone') {
    return (
      <ComingSoonScreen
        zoneLabel={zoneName}
        onRetry={useDeviceLocation}
        onChangeLocation={() => setShowChangeLocation(true)}
      />
    );
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
