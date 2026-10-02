import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyRound } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { colors } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export function OtpVerifyScreen({ route, navigation }: Props) {
  const { phone, devOtp } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp) {
      setError('Enter the OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<any>('/auth/otp/verify', {
        method: 'POST',
        auth: false,
        body: { phone, otp, role: 'provider' },
      });

      if (data.requiresRegistration) {
        navigation.navigate('Register', {
          phone,
          registrationToken: data.registrationToken,
        });
        return;
      }

      await login(data);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.brand}>
        <View style={styles.badge}>
          <KeyRound color={colors.primary} size={28} />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          OTP sent to <Text style={styles.bold}>{phone}</Text>
        </Text>
        {devOtp ? (
          <View style={styles.devHint}>
            <Text style={styles.devHintText}>
              Dev mode: OTP is <Text style={styles.bold}>{devOtp}</Text>
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.form}>
        <Input
          label="Enter OTP"
          placeholder="6-digit OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={t => setOtp(t.replace(/\D/g, ''))}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button title="Verify OTP" onPress={handleVerify} loading={loading} />
        <Button
          title="Change phone number"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
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
    marginBottom: 32,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 6,
  },
  bold: {
    fontWeight: '700',
    color: colors.foreground,
  },
  devHint: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  devHintText: {
    color: colors.accentForeground,
    fontSize: 12,
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
