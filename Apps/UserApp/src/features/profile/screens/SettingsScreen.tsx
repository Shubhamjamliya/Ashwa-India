import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Bell, LogOut, ShieldAlert, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAuth } from '../../../context/AuthContext';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Settings'>;

const PUSH_PREF_KEY = 'ashwa_user_push_enabled';

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PUSH_PREF_KEY).then(raw => {
      if (raw != null) setPushEnabled(raw === 'true');
    });
  }, []);

  const togglePush = (value: boolean) => {
    setPushEnabled(value);
    AsyncStorage.setItem(PUSH_PREF_KEY, String(value)).catch(() => {});
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'To permanently delete your account and data, please contact our support team — this helps us verify your identity before removing any data.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft color={colors.foreground} size={20} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Bell color={colors.primary} size={18} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Text style={styles.rowSublabel}>Get alerts for orders and inquiries</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={togglePush}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Pressable style={[styles.row, styles.rowLast]} onPress={handleLogout}>
            <View style={styles.iconWrap}>
              <LogOut color={colors.primary} size={18} />
            </View>
            <Text style={styles.rowLabel}>Log out</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Pressable style={[styles.row, styles.rowLast]} onPress={handleDeleteAccount}>
            <View style={[styles.iconWrap, styles.dangerIconWrap]}>
              <Trash2 color={colors.destructive} size={18} />
            </View>
            <Text style={[styles.rowLabel, styles.dangerText]}>Delete Account</Text>
          </Pressable>
        </View>

        <View style={styles.noticeRow}>
          <ShieldAlert color={colors.mutedForeground} size={14} />
          <Text style={styles.noticeText}>
            Your data is kept private and is never shared without your consent.
          </Text>
        </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dangerCard: {
    marginTop: spacing.md,
    borderColor: '#FCA5A5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIconWrap: {
    backgroundColor: '#FEE2E2',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  rowSublabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  dangerText: {
    color: colors.destructive,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: colors.mutedForeground,
    lineHeight: 15,
  },
});
