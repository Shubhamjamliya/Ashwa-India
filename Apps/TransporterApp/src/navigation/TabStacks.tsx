import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { BookingsScreen } from '../features/bookings/screens/BookingsScreen';
import { WalletScreen } from '../features/wallet/screens/WalletScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { TripScreen } from '../features/trips/screens/TripScreen';
import { EarningsScreen } from '../features/earnings/screens/EarningsScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { EditProfileScreen } from '../features/profile/screens/EditProfileScreen';
import { SettingsScreen } from '../features/profile/screens/SettingsScreen';
import { HelpSupportScreen } from '../features/profile/screens/HelpSupportScreen';
import { AboutScreen } from '../features/profile/screens/AboutScreen';
import { VehiclesScreen } from '../features/fleet/screens/VehiclesScreen';
import { DriversScreen } from '../features/fleet/screens/DriversScreen';
import { KycScreen } from '../features/kyc/screens/KycScreen';
import { WithdrawalsScreen } from '../features/withdrawals/screens/WithdrawalsScreen';
import { ReviewsScreen } from '../features/reviews/screens/ReviewsScreen';
import { JobsScreen } from '../features/jobs/screens/JobsScreen';
import { JobDetailScreen } from '../features/jobs/screens/JobDetailScreen';
import { PostJobScreen } from '../features/jobs/screens/PostJobScreen';
import { ManageJobScreen } from '../features/jobs/screens/ManageJobScreen';
import type { AppStackParamList, TabRootParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 220,
} as const;

// Registered in every tab's stack (see InnerStackParamList).
const innerScreens = (
  <>
    <Stack.Screen name="Trip" component={TripScreen} />
    <Stack.Screen name="Earnings" component={EarningsScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
    <Stack.Screen name="Vehicles" component={VehiclesScreen} />
    <Stack.Screen name="Drivers" component={DriversScreen} />
    <Stack.Screen name="Kyc" component={KycScreen} />
    <Stack.Screen name="Withdrawals" component={WithdrawalsScreen} />
    <Stack.Screen name="Reviews" component={ReviewsScreen} />
    <Stack.Screen name="Jobs" component={JobsScreen} />
    <Stack.Screen name="JobDetail" component={JobDetailScreen} />
    <Stack.Screen name="PostJob" component={PostJobScreen} />
    <Stack.Screen name="ManageJob" component={ManageJobScreen} />
  </>
);

function tabStack(rootName: keyof TabRootParamList, Root: React.ComponentType<any>) {
  return function TabStack() {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name={rootName} component={Root} />
        {innerScreens}
      </Stack.Navigator>
    );
  };
}

export const HomeStack = tabStack('HomeMain', HomeScreen);
export const BookingsStack = tabStack('BookingsMain', BookingsScreen);
export const WalletStack = tabStack('WalletMain', WalletScreen);
export const ProfileStack = tabStack('ProfileMain', ProfileScreen);
