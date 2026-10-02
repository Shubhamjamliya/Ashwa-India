export type AuthStackParamList = {
  PhoneLogin: undefined;
  OtpVerify: { phone: string; devOtp?: string };
  Register: { phone: string; registrationToken: string };
};

export type MainStackParamList = {
  Dashboard: undefined;
};
