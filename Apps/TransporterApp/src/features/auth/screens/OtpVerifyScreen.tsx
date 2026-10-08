import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyRound } from 'lucide-react-native';
import { Button } from '../../../components/Button';
import { colors, radius } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import type { AuthStackParamList } from '../../../navigation/types';
import { AuthLayout, IconInput, authStyles } from '../components/AuthLayout';

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
        body: { phone, otp, role: 'transporter' },
      });
      if (data.requiresRegistration) {
        navigation.navigate('Register', { phone, registrationToken: data.registrationToken });
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
    <AuthLayout>
      <View style={authStyles.gap}>
        <Text style={styles.sent}>
          OTP sent to <Text style={styles.bold}>{phone}</Text>.{' '}
          <Text style={styles.change} onPress={() => navigation.goBack()}>
            Change
          </Text>
        </Text>
        {devOtp ? (
          <View style={styles.dev}>
            <Text style={styles.devText}>
              Dev mode: OTP is <Text style={styles.devBold}>{devOtp}</Text>
            </Text>
          </View>
        ) : null}
        <IconInput
          label="Enter OTP"
          icon={KeyRound}
          placeholder="6-digit OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
        />
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        <Button title={loading ? 'Verifying...' : 'Verify OTP'} onPress={handleVerify} loading={loading} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  sent: { fontSize: 14, color: '#525252' },
  bold: { fontWeight: '600' },
  change: { fontWeight: '600', color: colors.primary },
  dev: { borderRadius: radius.sm, borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 8 },
  devText: { fontSize: 12, color: '#D97706' },
  devBold: { fontWeight: '700' },
});
