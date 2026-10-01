import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoBadge } from '../../../components/LogoBadge';
import { OtpInput } from '../../../components/OtpInput';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { fetchBranding } from '../../../services/branding';
import { useAuth } from '../../../context/AuthContext';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export function OtpVerifyScreen({ route, navigation }: Props) {
  const { phone, devOtp } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBranding().then(b => setLogoUrl(b.logoUrl));
  }, []);

  const handleVerify = async (code: string) => {
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<any>('/auth/otp/verify', {
        method: 'POST',
        auth: false,
        body: { phone, otp: code, role: 'user' },
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

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setError('');
    if (value.length === 6) handleVerify(value);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.hero} edges={['top']}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.navyForeground} size={20} />
        </Pressable>
        <View style={styles.heroContent}>
          <LogoBadge size={64} logoUrl={logoUrl} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.sheetSafe} edges={['bottom']}>
          <ScrollView
            style={styles.sheet}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHandle} />
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to <Text style={styles.bold}>+91 {phone}</Text>
            </Text>

            {devOtp ? (
              <View style={styles.devHint}>
                <Text style={styles.devHintText}>
                  Dev mode: OTP is <Text style={styles.bold}>{devOtp}</Text>
                </Text>
              </View>
            ) : null}

            <View style={styles.otpWrap}>
              <OtpInput value={otp} onChange={handleOtpChange} autoFocus />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Verify & Continue"
              onPress={() => handleVerify(otp)}
              loading={loading}
              disabled={otp.length !== 6}
              style={styles.verifyBtn}
            />
            <Button title="Change phone number" variant="outline" onPress={() => navigation.goBack()} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  hero: {
    backgroundColor: colors.navy,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLight,
    marginLeft: spacing.md,
    marginTop: spacing.sm,
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + spacing.md,
  },
  sheetWrap: {
    flex: 1,
  },
  sheetSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -radius.xl,
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
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
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  devHintText: {
    color: colors.accentForeground,
    fontSize: 12,
  },
  otpWrap: {
    marginTop: spacing.xl,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    marginTop: spacing.md,
  },
  verifyBtn: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
