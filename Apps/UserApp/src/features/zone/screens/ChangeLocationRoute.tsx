import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLocationContext } from '../../../context/LocationContext';
import { ChangeLocationScreen } from './ChangeLocationScreen';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ChangeLocation'>;

// Thin wrapper that connects the presentational ChangeLocationScreen to
// react-navigation + LocationContext — used for the normal in-app flow
// (tapping the location on Home). ZoneGate renders ChangeLocationScreen
// directly (without this wrapper) for the "stuck" states, since those render
// outside any navigator.
export function ChangeLocationRoute() {
  const navigation = useNavigation<Nav>();
  const { setManualLocation, useDeviceLocation } = useLocationContext();

  return (
    <ChangeLocationScreen
      onClose={() => navigation.goBack()}
      onSelect={loc => {
        setManualLocation(loc);
        navigation.goBack();
      }}
      onUseCurrentLocation={() => {
        useDeviceLocation();
        navigation.goBack();
      }}
    />
  );
}
