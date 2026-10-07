import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Package } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { money } from '../../../utils/format';
import type { Order } from '../../store/types';
import type { HomeStackParamList } from '../../../navigation/types';
import { ORDER_STATUS } from '../status';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'OrdersMain'>;

// Order history, newest first. Tap an order for its tracking and invoice.
export function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    () =>
      apiFetch<{ orders: Order[] }>('/store/orders')
        .then(data => setOrders(data.orders || []))
        .catch(() => setOrders([])),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Your orders" back="solid" titleSize={20} />

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyView
              icon={<Package color="#A3A3A3" size={32} />}
              title="No orders yet"
              text="Your accessories store orders will show up here once you place one."
            />
          }
          renderItem={({ item }) => {
            const meta = ORDER_STATUS[item.status] || ORDER_STATUS.pending;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}>
                <View style={styles.cardTop}>
                  <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                  <Text style={[styles.pill, { backgroundColor: `${meta.color}20`, color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={styles.seller}>{item.seller?.businessName || item.seller?.name}</Text>
                <Text style={styles.items}>
                  {item.items
                    .map(i => `${i.quantity} × ${typeof i.product === 'object' ? i.product.name : 'Item'}`)
                    .join(', ')}
                </Text>
                <View style={styles.cardFoot}>
                  <Text style={styles.total}>{money(item.total)}</Text>
                  <View style={styles.details}>
                    <Text style={styles.detailsText}>Details</Text>
                    <ChevronRight color={colors.mutedForeground} size={14} />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  list: { padding: spacing.md, gap: 10 },
  card: {
    gap: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.muted },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  pill: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  seller: { fontSize: 12, color: colors.mutedForeground },
  items: { fontSize: 12, color: '#525252' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  total: { fontSize: 14, fontWeight: '800', color: colors.primary },
  details: { flexDirection: 'row', alignItems: 'center' },
  detailsText: { fontSize: 12, fontWeight: '700', color: colors.mutedForeground },
});
