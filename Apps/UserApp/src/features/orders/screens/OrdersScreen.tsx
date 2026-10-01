import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import type { Order } from '../../store/types';

const statusLabel: Record<Order['status'], string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const statusColor: Record<Order['status'], string> = {
  pending: colors.warning,
  processing: colors.info,
  shipped: colors.info,
  delivered: colors.success,
  cancelled: colors.destructive,
  returned: colors.destructive,
};

export function OrdersScreen() {
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ orders: Order[] }>('/store/orders');
      setOrders(data.orders);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      load().finally(() => setLoading(false));
    }
  }, [isFocused, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <Screen style={styles.noPadding}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Package color={colors.mutedForeground} size={32} />
              <Text style={styles.title}>No orders yet</Text>
              <Text style={styles.text}>
                Your accessories store orders will show up here once you place one.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor[item.status]}20` }]}>
                  <Text style={[styles.statusText, { color: statusColor[item.status] }]}>
                    {statusLabel[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.sellerName}>
                {item.seller?.businessName || item.seller?.name}
              </Text>
              {item.items.map((orderItem, idx) => (
                <Text key={idx} style={styles.itemLine}>
                  {orderItem.quantity} × {typeof orderItem.product === 'object' ? orderItem.product.name : 'Item'}
                </Text>
              ))}
              <Text style={styles.total}>Total: ₹{item.total.toLocaleString('en-IN')}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: {
    padding: 0,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.xl,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 8,
  },
  text: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sellerName: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  itemLine: {
    fontSize: 13,
    color: colors.foreground,
    marginTop: 4,
  },
  total: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
});
