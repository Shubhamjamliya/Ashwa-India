import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IncomingRequestsScreen } from '../features/requests/screens/IncomingRequestsScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IncomingRequests" component={IncomingRequestsScreen} />
    </Stack.Navigator>
  );
}
