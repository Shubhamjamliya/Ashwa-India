import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { HorseMarketplaceScreen } from '../features/marketplace/screens/HorseMarketplaceScreen';
import { HorseDetailScreen } from '../features/marketplace/screens/HorseDetailScreen';
import { StoreScreen } from '../features/store/screens/StoreScreen';
import { ProductDetailScreen } from '../features/store/screens/ProductDetailScreen';
import { CartScreen } from '../features/store/screens/CartScreen';
import { CheckoutScreen } from '../features/store/screens/CheckoutScreen';
import { SelectAddressScreen } from '../features/address/screens/SelectAddressScreen';
import { AddressFormScreen } from '../features/address/screens/AddressFormScreen';
import { WishlistScreen } from '../features/wishlist/screens/WishlistScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { TransportLocationScreen } from '../features/transport/screens/TransportLocationScreen';
import { TransportResultsScreen } from '../features/transport/screens/TransportResultsScreen';
import { SavedAddressesScreen } from '../features/profile/screens/SavedAddressesScreen';
import { HelpSupportScreen } from '../features/profile/screens/HelpSupportScreen';
import { AboutScreen } from '../features/profile/screens/AboutScreen';
import { SettingsScreen } from '../features/profile/screens/SettingsScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 220,
      }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="HorseMarketplace" component={HorseMarketplaceScreen} />
      <Stack.Screen name="HorseDetail" component={HorseDetailScreen} />
      <Stack.Screen name="Store" component={StoreScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="SelectAddress" component={SelectAddressScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddressForm" component={AddressFormScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="TransportLocation" component={TransportLocationScreen} />
      <Stack.Screen name="TransportResults" component={TransportResultsScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
