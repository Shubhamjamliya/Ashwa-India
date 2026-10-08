import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Trash2, X } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getDismissed, setDismissed, type AppNotification } from '../../../services/notifications';
import { timeAgo } from '../../../utils/format';

export function NotificationsScreen() {
  const [all, setAll] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch<{ notifications: AppNotification[] }>('/notifications'), getDismissed()])
      .then(([data, dismissed]) => {
        setAll(data.notifications || []);
        setDismissedIds(dismissed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (ids: string[]) => {
    setDismissedIds(ids);
    setDismissed(ids);
  };

  const notifications = all.filter(n => !dismissedIds.includes(n._id));

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader
        title="Notifications"
        titleSize={17}
        right={
          notifications.length > 0 ? (
            <Pressable style={styles.clearBtn} onPress={() => update(all.map(n => n._id))} hitSlop={6}>
              <Trash2 color="#FDA4AF" size={18} />
            </Pressable>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyView icon={<Bell color="#A3A3A3" size={28} />} title="No notifications yet." />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.icon}>
                <Bell color={colors.primary} size={16} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              </View>
              <Pressable style={styles.dismiss} hitSlop={8} onPress={() => update([...dismissedIds, item._id])}>
                <X color={colors.mutedForeground} size={16} />
              </Pressable>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  clearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  message: { fontSize: 13, lineHeight: 18, color: colors.mutedForeground, marginTop: 2 },
  time: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  dismiss: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
