import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { HorseMarketplaceScreen } from '../features/marketplace/screens/HorseMarketplaceScreen';
import { HorseDetailScreen } from '../features/marketplace/screens/HorseDetailScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="HorseMarketplace" component={HorseMarketplaceScreen} />
      <Stack.Screen name="HorseDetail" component={HorseDetailScreen} />
    </Stack.Navigator>
  );
}
