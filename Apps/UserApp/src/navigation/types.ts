export type AuthStackParamList = {
  PhoneLogin: undefined;
  OtpVerify: { phone: string; devOtp?: string };
  Register: { phone: string; registrationToken: string };
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  HorseMarketplace: undefined;
  HorseDetail: { horseId: string };
};
