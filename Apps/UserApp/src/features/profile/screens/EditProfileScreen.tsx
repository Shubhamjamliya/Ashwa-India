import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, User as UserIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'EditProfile'>;

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const data = await apiFetch<{ user: typeof user }>('/users/me', {
        method: 'PATCH',
        body: { name: name.trim(), email: email.trim() },
      });
      if (data.user) await updateUser(data.user);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <UserIcon color={colors.primary} size={32} />
            </View>
          </View>
        </View>

        <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
        <Input
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input label="Phone Number" value={user?.phone || ''} editable={false} style={styles.disabledInput} />
        <Text style={styles.hint}>Phone number is verified via OTP and can't be changed here.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledInput: {
    backgroundColor: colors.muted,
    color: colors.mutedForeground,
  },
  hint: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: -spacing.xs,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
});
