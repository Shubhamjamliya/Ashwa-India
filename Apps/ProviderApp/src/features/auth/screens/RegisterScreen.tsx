import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle2 } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { colors } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import type { AuthStackParamList } from '../../../navigation/types';

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
      // Provider accounts need admin approval, so this won't log in right
      // away — it returns a pending message instead of tokens (unlike 'user').
      const data = await apiFetch<any>('/auth/register', {
        method: 'POST',
        auth: false,
        body: { registrationToken, name, email, businessName },
      });
      if (data.accessToken) {
        await login(data);
      } else {
        setPending(true);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.brand}>
          <View style={styles.badge}>
            <CheckCircle2 color={colors.success} size={28} />
          </View>
          <Text style={styles.title}>Application Submitted</Text>
          <Text style={styles.subtitle}>
            Your account is awaiting admin approval. You'll be able to sign in once it's approved.
          </Text>
        </View>
        <Button title="Back to Login" onPress={() => navigation.popToTop()} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.brand}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Tell us about your service business</Text>
      </View>

      <View style={styles.form}>
        <Input label="Full Name" placeholder="Your name" value={name} onChangeText={setName} />
        <Input
          label="Business Name (optional)"
          placeholder="Your service business name"
          value={businessName}
          onChangeText={setBusinessName}
        />
        <Input
          label="Email (optional)"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button title="Submit Application" onPress={handleRegister} loading={loading} />
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
    marginBottom: 32,
    alignItems: 'center',
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
