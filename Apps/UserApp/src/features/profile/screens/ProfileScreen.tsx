import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mail, Phone, User as UserIcon } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { colors, radius, spacing } from '../../../theme/colors';
import { useAuth } from '../../../context/AuthContext';

export function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <UserIcon color={colors.primary} size={28} />
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.status}>Account: {user?.status}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Phone size={16} color={colors.mutedForeground} />
          <Text style={styles.rowText}>{user?.phone}</Text>
        </View>
        {user?.email ? (
          <View style={styles.row}>
            <Mail size={16} color={colors.mutedForeground} />
            <Text style={styles.rowText}>{user.email}</Text>
          </View>
        ) : null}
      </View>

      <Button
        title="Logout"
        variant="outline"
        onPress={() => logout()}
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  status: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowText: {
    fontSize: 14,
    color: colors.foreground,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
});
