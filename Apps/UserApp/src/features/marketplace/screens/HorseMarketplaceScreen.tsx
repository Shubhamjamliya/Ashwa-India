import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Heart, MapPin } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '../../../components/Screen';
import { NavyHeader } from '../../../components/NavyHeader';
import { EmptyView, ErrorView, LoadingView } from '../../../components/StateViews';
import { colors, radius, spacing } from '../../../theme/colors';
import { apiFetch } from '../../../services/api';
import { getMediaUrl } from '../../../services/media';
import { useWishlist } from '../../../context/WishlistContext';
import type { Horse } from '../types';
import { priceLabel } from '../price';
import type { HomeStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HorseMarketplace'>;
type Rt = RouteProp<HomeStackParamList, 'HorseMarketplace'>;

// Quick tabs map onto listing filters, so the same server filters serve the app and the API.
const TABS: { key: string; label: string; filter: Record<string, string> }[] = [
  { key: 'all', label: 'All', filter: {} },
  { key: 'stallions', label: 'Stallions', filter: { gender: 'stallion' } },
  { key: 'foals', label: 'Foals', filter: { maxAge: '1' } },
  { key: 'lease', label: 'For lease', filter: { listingType: 'lease' } },
];

export function HorseMarketplaceScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { isSaved, toggle } = useWishlist();
  const [tab, setTab] = useState('all');
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const query: Record<string, string> = { ...(TABS.find(t => t.key === tab)?.filter || {}) };
      if (params?.category) query.category = params.category;
      if (params?.location) query.location = params.location;
      const qs = Object.entries(query)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      const data = await apiFetch<{ horses: Horse[] }>(`/marketplace/horses${qs ? `?${qs}` : ''}`);
      setHorses(data.horses || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load listings');
    }
  }, [tab, params?.category, params?.location]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen style={styles.noPadding} topColor={colors.navy}>
      <NavyHeader title="Horse Marketplace" />

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} />
      ) : (
        <FlatList
          data={horses}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyView title="No horses listed yet." />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('HorseDetail', { horseId: item._id })}>
              <View style={styles.thumbWrap}>
                {item.photos?.[0] ? <Image source={{ uri: getMediaUrl(item.photos[0]) }} style={styles.thumb} /> : null}
                <Pressable style={styles.heartBtn} hitSlop={8} onPress={() => toggle(item)}>
                  <Heart color={colors.white} size={14} fill={isSaved(item._id) ? colors.white : 'transparent'} />
                </Pressable>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.breed} numberOfLines={1}>
                  {item.breed}
                </Text>
                <Text style={styles.category} numberOfLines={1}>
                  {item.category?.name}
                </Text>
                {item.location ? (
                  <View style={styles.locationRow}>
                    <MapPin color={colors.mutedForeground} size={12} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.price}>{priceLabel(item)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  tabs: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 12 },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  tabTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  thumbWrap: { width: 96, height: 96, backgroundColor: colors.muted },
  thumb: { width: 96, height: 96 },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15,34,56,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0, padding: 12, justifyContent: 'center', gap: 2 },
  breed: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  category: { fontSize: 12, color: colors.mutedForeground },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { flex: 1, fontSize: 12, color: colors.mutedForeground },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },
});
