import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { BookingsScreen } from '../features/bookings/screens/BookingsScreen';
import { OrdersScreen } from '../features/orders/screens/OrdersScreen';
import { InquiriesScreen } from '../features/inquiries/screens/InquiriesScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
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
import { ChangeLocationRoute } from '../features/zone/screens/ChangeLocationRoute';
import { EditProfileScreen } from '../features/profile/screens/EditProfileScreen';
import { TransportLocationScreen } from '../features/transport/screens/TransportLocationScreen';
import { TransportResultsScreen } from '../features/transport/screens/TransportResultsScreen';
import { SavedAddressesScreen } from '../features/profile/screens/SavedAddressesScreen';
import { HelpSupportScreen } from '../features/profile/screens/HelpSupportScreen';
import { AboutScreen } from '../features/profile/screens/AboutScreen';
import { SettingsScreen } from '../features/profile/screens/SettingsScreen';
import { ServicesScreen } from '../features/services/screens/ServicesScreen';
import { ServiceProvidersScreen } from '../features/services/screens/ServiceProvidersScreen';
import { ProviderProfileScreen } from '../features/services/screens/ProviderProfileScreen';
import { EventsScreen } from '../features/events/screens/EventsScreen';
import { WalletScreen } from '../features/wallet/screens/WalletScreen';
import { OrderDetailScreen } from '../features/orders/screens/OrderDetailScreen';
import { InquiryThreadScreen } from '../features/inquiries/screens/InquiryThreadScreen';
import { JobsScreen } from '../features/jobs/screens/JobsScreen';
import { JobDetailScreen } from '../features/jobs/screens/JobDetailScreen';
import { PostJobScreen } from '../features/jobs/screens/PostJobScreen';
import { ManageJobScreen } from '../features/jobs/screens/ManageJobScreen';
import type { HomeStackParamList, TabRootParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 220,
} as const;

// Registered in every tab's stack (see InnerStackParamList).
const innerScreens = (
  <>
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
    <Stack.Screen name="ChangeLocation" component={ChangeLocationRoute} options={{ presentation: 'modal' }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="TransportLocation" component={TransportLocationScreen} />
    <Stack.Screen name="TransportResults" component={TransportResultsScreen} />
    <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Services" component={ServicesScreen} />
    <Stack.Screen name="ServiceProviders" component={ServiceProvidersScreen} />
    <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
    <Stack.Screen name="Events" component={EventsScreen} />
    <Stack.Screen name="Wallet" component={WalletScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    <Stack.Screen name="InquiryThread" component={InquiryThreadScreen} />
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
export const BookingStack = tabStack('BookingsMain', BookingsScreen);
export const OrdersStack = tabStack('OrdersMain', OrdersScreen);
export const EnquiryStack = tabStack('InquiriesMain', InquiriesScreen);
export const ProfileStack = tabStack('ProfileMain', ProfileScreen);
