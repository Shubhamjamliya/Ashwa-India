import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BookingStack, EnquiryStack, HomeStack, OrdersStack, ProfileStack } from './TabStacks';
import { CustomTabBar } from './CustomTabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const renderTabBar = (props: React.ComponentProps<typeof CustomTabBar>) => <CustomTabBar {...props} />;

export function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
      }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Booking" component={BookingStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Enquiry" component={EnquiryStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
