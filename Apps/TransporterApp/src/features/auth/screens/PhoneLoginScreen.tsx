import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { colors } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import type { AuthStackParamList } from '../../../navigation/types';

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
      const data = await apiFetch<{ phone: string; devOtp?: string }>(
        '/auth/otp/request',
        { method: 'POST', auth: false, body: { phone, role: 'transporter' } },
      );
      navigation.navigate('OtpVerify', { phone, devOtp: data.devOtp });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.brand}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>A</Text>
        </View>
        <Text style={styles.title}>Ashwa India Transporter</Text>
        <Text style={styles.subtitle}>Receive and respond to transport requests</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Phone Number"
          placeholder="10-digit mobile number"
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={t => setPhone(t.replace(/\D/g, ''))}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button title="Send OTP" onPress={handleSendOtp} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 40,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    gap: 8,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    marginBottom: 4,
  },
});
