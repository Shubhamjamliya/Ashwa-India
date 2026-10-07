import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Mail, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoBadge } from '../../../components/LogoBadge';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { fetchBranding } from '../../../services/branding';
import { useAuth } from '../../../context/AuthContext';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ route }: Props) {
  const { phone, registrationToken } = route.params;
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // For the "user" role, registration auto-activates and logs you in
      // immediately — no admin approval needed (unlike sellers/providers).
      const data = await apiFetch<any>('/auth/register', {
        method: 'POST',
        auth: false,
        body: { registrationToken, name, email },
      });
      await login(data);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          <Text style={styles.brandTagline}>Horses, services & transport — all in one place</Text>
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Just a couple of details to get started, <Text style={styles.semibold}>{phone}</Text>.
            </Text>

            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <User color="#A3A3A3" size={16} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, styles.mt16]}>Email (optional)</Text>
            <View style={styles.inputWrap}>
              <Mail color="#A3A3A3" size={16} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title={loading ? 'Creating account...' : 'Create Account'}
              onPress={handleRegister}
              loading={loading}
              style={styles.submit}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  hero: { backgroundColor: colors.navy },
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  brandName: { fontSize: 24, fontWeight: '800', color: colors.navyForeground, marginTop: spacing.md, letterSpacing: 0.3 },
  brandTagline: { fontSize: 13, color: colors.navyMuted, marginTop: 6, textAlign: 'center' },
  sheetWrap: { flex: 1 },
  sheetSafe: { flex: 1, backgroundColor: colors.background },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -radius.xl,
  },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 6, marginBottom: 20 },
  semibold: { fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginBottom: 6 },
  mt16: { marginTop: spacing.md },
  inputWrap: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 0 },
  errorText: { color: colors.destructive, fontSize: 13, marginTop: 10 },
  submit: { marginTop: spacing.lg },
});
