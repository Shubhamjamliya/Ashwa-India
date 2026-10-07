import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarClock, MessageSquare } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useSocketEvents } from '../../../services/useSocketEvents';
import { fmtDateTime } from '../../../utils/format';
import type { HomeStackParamList } from '../../../navigation/types';
import type { Inquiry, Visit, VisitStatus } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'InquiriesMain'>;

const VISIT_STYLE: Record<VisitStatus, { bg: string; fg: string }> = {
  pending: { bg: '#FEF3C7', fg: '#B45309' },
  accepted: { bg: '#D1FAE5', fg: '#047857' },
  declined: { bg: '#FEE2E2', fg: '#B91C1C' },
  cancelled: { bg: '#E5E5E5', fg: '#404040' },
};

const TABS = [
  { key: 'conversations', label: 'Conversations', icon: MessageSquare },
  { key: 'visits', label: 'Visit requests', icon: CalendarClock },
] as const;

export function InquiriesScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<'conversations' | 'visits'>('conversations');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () =>
      Promise.all([
        apiFetch<{ inquiries: Inquiry[] }>('/marketplace/inquiries/mine'),
        apiFetch<{ visits: Visit[] }>('/marketplace/visits/mine'),
      ])
        .then(([i, v]) => {
          setInquiries(i.inquiries || []);
          setVisits(v.visits || []);
        })
        .catch(() => {}),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      refresh().finally(() => setLoading(false));
    }, [refresh]),
  );

  useSocketEvents({ 'visit:update': refresh, 'inquiry:message': refresh });

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Horse enquiries" back="solid" />

      <View style={styles.tabs}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, active && styles.tabActive]}>
              <t.icon color={active ? colors.white : '#525252'} size={14} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <LoadingView />
      ) : tab === 'conversations' ? (
        <FlatList
          data={inquiries}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyView title="No conversations yet" text="Message a seller from a horse listing." />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, styles.convRow, pressed && styles.pressed]}
              onPress={() => navigation.navigate('InquiryThread', { inquiryId: item._id })}>
              <View style={styles.thumb}>
                {item.horse?.photos?.[0] ? (
                  <Image source={{ uri: getMediaUrl(item.horse.photos[0]) }} style={styles.fill} />
                ) : null}
              </View>
              <View style={styles.flex}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.horse?.name || item.horse?.breed}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.seller?.businessName || item.seller?.name}
                </Text>
                <Text style={styles.time}>{fmtDateTime(item.lastMessageAt || item.createdAt)}</Text>
              </View>
              {item.status === 'replied' ? <Text style={styles.replied}>Replied</Text> : null}
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={visits}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyView title="No visit requests yet" />}
          renderItem={({ item }) => {
            const st = VISIT_STYLE[item.status] || VISIT_STYLE.pending;
            return (
              <View style={[styles.card, styles.visitCard]}>
                <View style={styles.visitTop}>
                  <Text style={[styles.title, styles.flex]} numberOfLines={1}>
                    {item.horse?.name || item.horse?.breed}
                  </Text>
                  <Text style={[styles.badge, { backgroundColor: st.bg, color: st.fg }]}>{item.status}</Text>
                </View>
                <Text style={styles.sub}>Preferred: {fmtDateTime(item.preferredAt)}</Text>
                <Text style={styles.sub}>{item.seller?.businessName || item.seller?.name}</Text>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 4 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText: { fontSize: 12, fontWeight: '700', color: '#525252' },
  tabTextActive: { color: colors.white },
  list: { padding: spacing.md, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.muted },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  thumb: { width: 48, height: 48, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.muted },
  title: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  sub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  time: { fontSize: 11, color: '#A3A3A3', marginTop: 2 },
  replied: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  visitCard: { padding: spacing.md },
  visitTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
});
