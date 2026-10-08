import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, CheckCircle2, MapPin, XCircle } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { fmtDate } from '../../../utils/format';
import type { AppNavigation } from '../../../navigation/types';
import type { TransportRequest, TransportRequestStatus } from '../../trips/types';

type Tab = Exclude<TransportRequestStatus, 'pending'>;

const TABS: { key: Tab; label: string }[] = [
  { key: 'accepted', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_META: Record<Tab, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  accepted: { label: 'In progress', color: '#16a34a', icon: CheckCircle2 },
  completed: { label: 'Completed', color: colors.navy, icon: CheckCircle2 },
  rejected: { label: 'Declined', color: '#ef4444', icon: XCircle },
  cancelled: { label: 'Cancelled', color: '#64748B', icon: XCircle },
};

// Your transport job history, by status. Active bookings open their trip page.
export function BookingsScreen() {
  const navigation = useNavigation<AppNavigation>();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('accepted');

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ requests: TransportRequest[] }>('/transport/requests/incoming')
        .then(data => setRequests((data.requests || []).filter(r => r.status !== 'pending')))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  const filtered = useMemo(() => requests.filter(r => r.status === tab), [requests, tab]);

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Bookings" subtitle="Your transport job history" />

      <View style={styles.tabs}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                {t.label} ({requests.filter(r => r.status === t.key).length})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyView
              icon={<Calendar color="#A3A3A3" size={32} />}
              title={`No ${TABS.find(t => t.key === tab)?.label.toLowerCase()} bookings.`}
            />
          }
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status as Tab];
            const StatusIcon = meta.icon;
            return (
              <Pressable
                style={styles.card}
                onPress={() => item.status === 'accepted' && navigation.navigate('Trip', { requestId: item._id })}>
                <View style={styles.cardTop}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.user?.name || item.user?.phone}
                  </Text>
                  <View style={[styles.status, { backgroundColor: `${meta.color}1A` }]}>
                    <StatusIcon color={meta.color} size={12} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
                <View style={styles.routeRow}>
                  <MapPin color={colors.mutedForeground} size={12} />
                  <Text style={styles.route}>
                    {item.source.address} → {item.destination.address}
                  </Text>
                </View>
                <View style={styles.cardFoot}>
                  <Text style={styles.type}>
                    {item.type === 'shared' ? 'Shared ride' : 'Private transport'}
                    {item.quote?.amount ? ` · ₹${item.quote.amount.toLocaleString('en-IN')}` : ''}
                  </Text>
                  <Text style={styles.date}>{fmtDate(item.respondedAt || item.createdAt)}</Text>
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
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.md, paddingTop: 12 },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText: { fontSize: 11, fontWeight: '700', color: '#525252' },
  tabTextActive: { color: colors.white },
  list: { padding: spacing.md, gap: 10 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.foreground },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: spacing.sm },
  route: { flex: 1, fontSize: 12, color: colors.mutedForeground },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  type: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground },
  date: { fontSize: 11, color: '#A3A3A3' },
});
