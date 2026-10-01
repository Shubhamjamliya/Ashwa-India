import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoBadge } from '../../../components/LogoBadge';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { fetchBranding } from '../../../services/branding';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

export function PhoneLoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('Ashwa India');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBranding().then(b => {
      setCompanyName(b.companyName);
      setLogoUrl(b.logoUrl);
    });
  }, []);

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
        { method: 'POST', auth: false, body: { phone, role: 'user' } },
      );
      navigation.navigate('OtpVerify', { phone, devOtp: data.devOtp });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.hero} edges={['top']}>
        <View style={styles.heroContent}>
          <LogoBadge logoUrl={logoUrl} />
          <Text style={styles.brandName}>{companyName}</Text>
          <Text style={styles.brandTagline}>
            Horses, services & transport — all in one place
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <SafeAreaView style={styles.sheetSafe} edges={['bottom']}>
          <ScrollView
            style={styles.sheet}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHandle} />
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Sign in with your mobile number to continue</Text>

            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <View style={styles.phoneInputWrap}>
                <Input
                  placeholder="10-digit mobile number"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={t => {
                    setError('');
                    setPhone(t.replace(/\D/g, ''));
                  }}
                />
              </View>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              loading={loading}
              disabled={phone.length !== 10}
              style={styles.sendBtn}
            />

            <View style={styles.secureRow}>
              <ShieldCheck color={colors.mutedForeground} size={14} />
              <Text style={styles.secureText}>We'll send a one-time password to verify it's you</Text>
            </View>

            <Text style={styles.terms}>
              By continuing, you agree to Ashwa India's{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
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
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navyForeground,
    marginTop: spacing.md,
    letterSpacing: 0.3,
  },
  brandTagline: {
    fontSize: 13,
    color: colors.navyMuted,
    marginTop: 6,
    textAlign: 'center',
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
    marginBottom: spacing.lg,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countryCode: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  phoneInputWrap: {
    flex: 1,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  sendBtn: {
    marginTop: spacing.lg,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  secureText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  terms: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 16,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});
