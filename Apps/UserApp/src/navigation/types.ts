export type AuthStackParamList = {
  PhoneLogin: undefined;
  OtpVerify: { phone: string; devOtp?: string };
  Register: { phone: string; registrationToken: string };
};

import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Booking: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  HorseMarketplace: { category?: string; location?: string } | undefined;
  HorseDetail: { horseId: string };
  Store: { categoryId?: string } | undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
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
  SavedAddresses: undefined;
  HelpSupport: undefined;
  About: undefined;
  Settings: undefined;
};
