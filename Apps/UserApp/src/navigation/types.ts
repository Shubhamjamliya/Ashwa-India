import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  PhoneLogin: undefined;
  OtpVerify: { phone: string; devOtp?: string };
  Register: { phone: string; registrationToken: string };
};

// Every tab is a stack: its own first page plus all of these inner pages, so opening a page from
// any tab keeps that tab selected and back returns to where you were (like the web's history).
export type InnerStackParamList = {
  HorseMarketplace: { category?: string; location?: string } | undefined;
  HorseDetail: { horseId: string };
  Store: { categoryId?: string } | undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: { sellerId: string; coupon?: string };
  SelectAddress: undefined;
  AddressForm:
    | {
        editId?: string;
        presetLat?: number;
        presetLng?: number;
        presetLine1?: string;
        presetCity?: string;
        presetState?: string;
        presetPincode?: string;
        selectOnSave?: boolean;
      }
    | undefined;
  Wishlist: undefined;
  Notifications: undefined;
  ChangeLocation: undefined;
  EditProfile: undefined;
  TransportLocation: undefined;
  TransportResults: {
    source: { address: string; lat: number; lng: number };
    destination: { address: string; lat: number; lng: number };
  };
  SavedAddresses: undefined;
  HelpSupport: undefined;
  About: undefined;
  Settings: undefined;
  Services: undefined;
  ServiceProviders: { serviceKey: string };
  ProviderProfile: { serviceKey: string; providerId: string };
  Events: undefined;
  Wallet: undefined;
  OrderDetail: { orderId: string };
  InquiryThread: { inquiryId: string };
  Jobs: undefined;
  JobDetail: { jobId: string };
  PostJob: undefined;
  ManageJob: { jobId: string };
};

// The tabs' first pages. A stack only registers its own one of these.
export type TabRootParamList = {
  HomeMain: undefined;
  BookingsMain: undefined;
  OrdersMain: undefined;
  InquiriesMain: undefined;
  ProfileMain: undefined;
};

export type HomeStackParamList = TabRootParamList & InnerStackParamList;

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Booking: NavigatorScreenParams<HomeStackParamList> | undefined;
  Orders: NavigatorScreenParams<HomeStackParamList> | undefined;
  Enquiry: NavigatorScreenParams<HomeStackParamList> | undefined;
  Profile: NavigatorScreenParams<HomeStackParamList> | undefined;
};

// Navigation for any page inside a tab: push pages on the current tab's stack, or switch tabs.
export type AppNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;
