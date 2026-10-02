import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, LogOut } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

type AdminNotification = {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
};

export function DashboardScreen() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ notifications: AdminNotification[] }>('/notifications');
      setNotifications(data.notifications);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome, {user?.name || 'Provider'}</Text>
          <Text style={styles.headerSubtitle}>
            {user?.businessName || 'Ashwa India Service Provider'}
          </Text>
        </View>
        <Pressable onPress={logout} hitSlop={12} style={styles.logoutBtn}>
          <LogOut color={colors.navyForeground} size={18} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Bell color={colors.mutedForeground} size={32} />
          <Text style={styles.emptyText}>Nothing here yet — you'll see updates from Ashwa India as they come in.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMessage}>{item.message}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
    padding: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyForeground,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.navyMuted,
    marginTop: 2,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  cardMessage: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
});
