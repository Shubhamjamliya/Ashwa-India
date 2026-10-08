import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, LogOut, ShieldAlert, Trash2 } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { LightHeader } from '../../../components/LightHeader';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAuth } from '../../../context/AuthContext';

const PUSH_PREF_KEY = 'ashwa_transporter_push_enabled';

export function SettingsScreen() {
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

  const handleLogout = () =>
    Alert.alert('Log out?', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);

  const handleDeleteAccount = () =>
    Alert.alert(
      'Delete account',
      'To permanently delete your account and data, please contact our support team — this helps us verify your identity before removing any data.',
    );

  return (
    <Screen style={styles.noPadding}>
      <LightHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Bell color={colors.primary} size={18} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Text style={styles.rowSub}>Get alerts for new requests and payouts</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={togglePush}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.mt20]}>ACCOUNT</Text>
        <View style={styles.card}>
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={handleLogout}>
            <View style={styles.iconWrap}>
              <LogOut color={colors.primary} size={18} />
            </View>
            <Text style={styles.rowLabel}>Log out</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.danger]}>
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.dangerPressed]} onPress={handleDeleteAccount}>
            <View style={[styles.iconWrap, styles.dangerIcon]}>
              <Trash2 color={colors.destructive} size={18} />
            </View>
            <Text style={[styles.rowLabel, styles.dangerText]}>Delete Account</Text>
          </Pressable>
        </View>

        <View style={styles.notice}>
          <ShieldAlert color={colors.mutedForeground} size={14} />
          <Text style={styles.noticeText}>Your data is kept private and is never shared without your consent.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  mt20: { marginTop: 20 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, color: colors.mutedForeground, marginTop: spacing.sm, marginBottom: spacing.sm },
  card: { overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingVertical: 14 },
  pressed: { backgroundColor: colors.muted },
  iconWrap: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  rowSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  danger: { marginTop: spacing.md, borderColor: '#FECDD3' },
  dangerPressed: { backgroundColor: '#FFF1F2' },
  dangerIcon: { backgroundColor: '#FEE2E2' },
  dangerText: { color: colors.destructive },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 20 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 15, color: colors.mutedForeground },
});
