import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Building2, CheckCircle2, Mail, User } from 'lucide-react-native';
import { Button } from '../../../components/Button';
import { colors, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import type { AuthStackParamList } from '../../../navigation/types';
import { AuthLayout, IconInput, authStyles } from '../components/AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ route, navigation }: Props) {
  const { registrationToken } = route.params;
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Transporter accounts need admin approval, so this usually returns no tokens.
      const data = await apiFetch<any>('/auth/register', {
        method: 'POST',
        auth: false,
        body: { registrationToken, name, businessName, email },
      });
      if (data.accessToken) await login(data);
      else setPending(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <AuthLayout>
        <View style={styles.pending}>
          <View style={styles.pendingIcon}>
            <CheckCircle2 color="#059669" size={28} />
          </View>
          <Text style={styles.pendingTitle}>Application Submitted</Text>
          <Text style={styles.pendingText}>
            Your account is awaiting admin approval. You'll be able to sign in once it's approved.
          </Text>
          <Button title="Back to Login" variant="outline" onPress={() => navigation.popToTop()} style={styles.full} />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <View style={authStyles.gap}>
        <Text style={styles.intro}>Tell us about your transport business.</Text>
        <IconInput label="Full Name" icon={User} value={name} onChangeText={setName} placeholder="Your name" />
        <IconInput
          label="Business Name (optional)"
          icon={Building2}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Your transport business name"
        />
        <IconInput
          label="Email (optional)"
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        <Button title={loading ? 'Submitting...' : 'Submit Application'} onPress={handleRegister} loading={loading} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, color: colors.mutedForeground },
  pending: { alignItems: 'center', paddingVertical: spacing.md },
  pendingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pendingTitle: { fontSize: 18, fontWeight: '700', color: '#171717', marginBottom: 4 },
  pendingText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: spacing.lg },
  full: { alignSelf: 'stretch' },
});
