import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  PhoneLogin: undefined;
  OtpVerify: { phone: string; devOtp?: string };
  Register: { phone: string; registrationToken: string };
};

// Every tab is a stack: its own first page plus all of these inner pages, so a page opened from
// any tab keeps that tab selected and back returns to where you were.
export type InnerStackParamList = {
  Trip: { requestId: string };
  Earnings: undefined;
  Notifications: undefined;
  EditProfile: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  About: undefined;
  Vehicles: undefined;
  Drivers: undefined;
  Kyc: undefined;
  Withdrawals: undefined;
  Reviews: undefined;
  Jobs: undefined;
  JobDetail: { jobId: string };
  PostJob: undefined;
  ManageJob: { jobId: string };
};

// The tabs' first pages. A stack only registers its own one of these.
export type TabRootParamList = {
  HomeMain: undefined;
  BookingsMain: undefined;
  WalletMain: undefined;
  ProfileMain: undefined;
};

export type AppStackParamList = TabRootParamList & InnerStackParamList;

export type MainTabParamList = {
  Home: NavigatorScreenParams<AppStackParamList> | undefined;
  Bookings: NavigatorScreenParams<AppStackParamList> | undefined;
  Wallet: NavigatorScreenParams<AppStackParamList> | undefined;
  Profile: NavigatorScreenParams<AppStackParamList> | undefined;
};

// Navigation for any page inside a tab: push pages on the current tab's stack, or switch tabs.
export type AppNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<AppStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;
