import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { colors } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ route }: Props) {
  const { registrationToken } = route.params;
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <Screen style={styles.screen}>
      <View style={styles.brand}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Just a couple of details to get started</Text>
      </View>

      <View style={styles.form}>
        <Input label="Full Name" placeholder="Your name" value={name} onChangeText={setName} />
        <Input
          label="Email (optional)"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button title="Create Account" onPress={handleRegister} loading={loading} />
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
  form: {
    gap: 8,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    marginBottom: 4,
  },
});
