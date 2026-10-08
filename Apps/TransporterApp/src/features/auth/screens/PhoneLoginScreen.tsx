import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Phone } from 'lucide-react-native';
import { Button } from '../../../components/Button';
import { apiFetch } from '../../../services/api';
import type { AuthStackParamList } from '../../../navigation/types';
import { AuthLayout, IconInput, authStyles } from '../components/AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

export function PhoneLoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<{ phone: string; devOtp?: string }>('/auth/otp/request', {
        method: 'POST',
        auth: false,
        body: { phone, role: 'transporter' },
      });
      navigation.navigate('OtpVerify', { phone, devOtp: data.devOtp });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={authStyles.gap}>
        <IconInput
          label="Phone Number"
          icon={Phone}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
        />
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        <Button title={loading ? 'Sending OTP...' : 'Send OTP'} onPress={handleSendOtp} loading={loading} />
      </View>
    </AuthLayout>
  );
}
