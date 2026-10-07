import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Trash2, X } from 'lucide-react-native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { HeaderIconButton } from '../../../components/CartIconButton';
import { colors, radius, spacing } from '../../../theme/colors';
import { useNotifications } from '../../../context/NotificationContext';

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsScreen() {
  const { notifications, loading, dismiss, dismissAll } = useNotifications();

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader
        title="Notifications"
        titleSize={18}
        right={
          notifications.length > 0 ? (
            <HeaderIconButton onPress={dismissAll}>
              <Trash2 color={colors.destructive} size={18} />
            </HeaderIconButton>
          ) : undefined
        }
      />

      {loading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Bell color={colors.mutedForeground} size={28} />
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Bell color={colors.primary} size={16} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              <Pressable hitSlop={10} onPress={() => dismiss(item._id)} style={styles.dismissBtn}>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 6,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  cardMessage: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
